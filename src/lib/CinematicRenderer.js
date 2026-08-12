/**
 * The cinematic stage renderer.
 *
 * Draws one frame of the sequence per tick through a single full-screen shader
 * pass (grade + defocus + bloom + vignette + grain + blurred backdrop fill),
 * with a drifting dust layer on top.
 *
 * Frames arrive as ImageBitmaps from FrameSequence. A tiny LRU texture pool
 * keeps GPU uploads down to one per frame change — the same cost a video
 * decoder pays — instead of one per rendered tick.
 *
 * If WebGL is unavailable the same API is served by a Canvas2D fallback, so
 * the film still plays (without the shader effects) rather than failing.
 */
import * as THREE from 'three'
import {
  filmVertexShader,
  filmFragmentShader,
  dustVertexShader,
  dustFragmentShader,
} from './shaders.js'

const IMAGE_ASPECT = 16 / 9

/* -------------------------------------------------------------- texture pool */

class TexturePool {
  constructor(size) {
    this.size = size
    this.map = new Map() // ImageBitmap -> { texture, used }
    this.tick = 0
  }

  get(bitmap, keep) {
    this.tick++
    const hit = this.map.get(bitmap)
    if (hit) {
      hit.used = this.tick
      return hit.texture
    }

    let texture
    if (this.map.size >= this.size) {
      let oldestKey = null
      let oldest = Infinity
      for (const [key, entry] of this.map) {
        if (key === keep) continue
        if (entry.used < oldest) {
          oldest = entry.used
          oldestKey = key
        }
      }
      if (oldestKey !== null) {
        texture = this.map.get(oldestKey).texture
        this.map.delete(oldestKey)
      }
    }

    if (!texture) {
      texture = new THREE.Texture()
      // The whole pass works in display space: the texture is sampled exactly
      // as encoded and written straight out, so the grade constants mean what
      // they look like and nothing is gamma-shifted on the way to the screen.
      texture.colorSpace = THREE.NoColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      texture.generateMipmaps = false
      // WebGL ignores UNPACK_FLIP_Y for ImageBitmap sources, so leaving flipY
      // on would orient the plate differently depending on the browser. We
      // upload unflipped and invert v in the vertex shader instead.
      texture.flipY = false
    }

    texture.image = bitmap
    texture.needsUpdate = true
    this.map.set(bitmap, { texture, used: this.tick })
    return texture
  }

  dispose() {
    for (const { texture } of this.map.values()) texture.dispose()
    this.map.clear()
  }
}

/* -------------------------------------------------------------------- dust */

function createDust(count) {
  const geometry = new THREE.BufferGeometry()
  const position = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const size = new Float32Array(count)
  const depth = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    position[i * 3] = Math.random()
    position[i * 3 + 1] = Math.random()
    position[i * 3 + 2] = 0
    seed[i] = Math.random()
    size[i] = 1.1 + Math.random() * 3.4
    depth[i] = Math.random()
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1))

  const material = new THREE.ShaderMaterial({
    vertexShader: dustVertexShader,
    fragmentShader: dustFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uParallax: { value: new THREE.Vector2() },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(0xffe6b8) },
    },
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return points
}

/* ---------------------------------------------------------------- WebGL path */

class WebGLStage {
  constructor(canvas, { maxPixels, dustCount, texturePool }) {
    this.isWebGL = true
    this.maxPixels = maxPixels
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
    })
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace

    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()

    this.uniforms = {
      uTexA: { value: null },
      uTexB: { value: null },
      uMix: { value: 0 },
      uHasB: { value: 0 },
      uImageAspect: { value: IMAGE_ASPECT },
      uScreenAspect: { value: 1 },
      uZoom: { value: 1 },
      uOffset: { value: new THREE.Vector2() },
      uExposure: { value: 1 },
      uContrast: { value: 1 },
      uSaturation: { value: 1 },
      uTint: { value: new THREE.Vector3(1, 1, 1) },
      uVignette: { value: 0.42 },
      uBloom: { value: 0.12 },
      uBlur: { value: 0 },
      uGrain: { value: 0.018 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: filmVertexShader,
        fragmentShader: filmFragmentShader,
        uniforms: this.uniforms,
        depthTest: false,
        depthWrite: false,
      })
    )
    plate.frustumCulled = false
    this.scene.add(plate)
    this.plate = plate

    this.dust = createDust(dustCount)
    this.scene.add(this.dust)

    this.pool = new TexturePool(texturePool)
  }

  resize(width, height, dpr) {
    const ratio = Math.min(dpr, Math.sqrt(this.maxPixels / Math.max(1, width * height)))
    this.renderer.setPixelRatio(Math.max(0.75, ratio))
    this.renderer.setSize(width, height, false)
    this.uniforms.uScreenAspect.value = width / height
    this.uniforms.uResolution.value.set(
      width * this.renderer.getPixelRatio(),
      height * this.renderer.getPixelRatio()
    )
    this.dust.material.uniforms.uScale.value = this.renderer.getPixelRatio()
  }

  draw(state) {
    const u = this.uniforms
    const { sample, grade, offset, time, reveal, dust } = state

    if (sample?.a) {
      u.uTexA.value = this.pool.get(sample.a, sample.b)
      if (sample.b) {
        u.uTexB.value = this.pool.get(sample.b, sample.a)
        u.uHasB.value = 1
        u.uMix.value = sample.mix
      } else {
        u.uHasB.value = 0
        u.uMix.value = 0
      }
    }

    u.uZoom.value = grade.zoom
    u.uOffset.value.set(offset.x, offset.y)
    u.uExposure.value = grade.exposure
    u.uContrast.value = grade.contrast
    u.uSaturation.value = grade.saturation
    u.uTint.value.set(grade.tint[0], grade.tint[1], grade.tint[2])
    u.uVignette.value = grade.vignette
    u.uBloom.value = grade.bloom
    u.uBlur.value = grade.blur
    u.uTime.value = time
    u.uReveal.value = reveal

    const d = this.dust.material.uniforms
    d.uTime.value = time
    d.uOpacity.value = dust.opacity
    d.uParallax.value.set(dust.parallaxX, dust.parallaxY)

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.pool.dispose()
    this.plate.geometry.dispose()
    this.plate.material.dispose()
    this.dust.geometry.dispose()
    this.dust.material.dispose()
    this.renderer.dispose()
  }
}

/* ------------------------------------------------------------- Canvas2D path */

class Canvas2DStage {
  constructor(canvas) {
    this.isWebGL = false
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = 1
    this.height = 1
  }

  resize(width, height, dpr) {
    const ratio = Math.min(dpr, 2)
    this.canvas.width = Math.round(width * ratio)
    this.canvas.height = Math.round(height * ratio)
    this.width = width
    this.height = height
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  draw(state) {
    const { ctx, width: w, height: h } = this
    const bitmap = state.sample?.a
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    if (!bitmap) return

    const zoom = state.grade.zoom
    const scale = Math.min(w / bitmap.width, h / bitmap.height) * zoom
    const dw = bitmap.width * scale
    const dh = bitmap.height * scale

    // Blurred cover backdrop, so there is never an empty margin.
    if (dw < w - 1 || dh < h - 1) {
      const cover = Math.max(w / bitmap.width, h / bitmap.height) * 1.18
      ctx.save()
      ctx.filter = 'blur(38px) brightness(0.32) saturate(0.6)'
      ctx.drawImage(
        bitmap,
        (w - bitmap.width * cover) / 2,
        (h - bitmap.height * cover) / 2,
        bitmap.width * cover,
        bitmap.height * cover
      )
      ctx.restore()
    }

    ctx.globalAlpha = state.reveal
    ctx.drawImage(bitmap, (w - dw) / 2, (h - dh) / 2, dw, dh)
    ctx.globalAlpha = 1

    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.75)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${state.grade.vignette})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  dispose() {}
}

/* -------------------------------------------------------------------- public */

export function createStage(canvas, options) {
  try {
    return new WebGLStage(canvas, options)
  } catch (err) {
    console.warn('[cinematic] WebGL unavailable, falling back to canvas', err)
    return new Canvas2DStage(canvas)
  }
}

/**
 * How far the plate may drift without ever exposing an edge.
 * At zoom 1 the whole frame is on screen and the budget is exactly zero, which
 * is what keeps the couple from being clipped during the opening shot.
 */
export function driftBudget(screenAspect, zoom) {
  const ratio = screenAspect / IMAGE_ASPECT
  const containX = Math.max(ratio, 1)
  const containY = Math.max(1 / ratio, 1)
  return {
    x: Math.max(0, 0.5 - (0.5 * containX) / zoom) * 0.85,
    y: Math.max(0, 0.5 - (0.5 * containY) / zoom) * 0.85,
  }
}

export { IMAGE_ASPECT }
