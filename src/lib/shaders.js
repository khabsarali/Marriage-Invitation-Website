/**
 * Shaders for the cinematic stage.
 *
 * The film plate is drawn "contain" — the whole 16:9 frame is always on screen,
 * so the bride and groom can never be clipped by the viewport, at any aspect
 * ratio. Whatever is left over is filled with a heavily blurred, darkened cover
 * copy of the same frame, so there is never a hard letterbox or an empty
 * margin. Everything else (defocus, bloom, grade, vignette, grain) happens in
 * the same pass.
 */

export const filmVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    // Textures are uploaded unflipped (see CinematicRenderer), so v runs top
    // to bottom here and matches the image's own row order.
    vUv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const filmFragmentShader = /* glsl */ `
  varying vec2 vUv;

  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;          // blend between the two nearest decoded frames
  uniform float uHasB;

  uniform float uImageAspect;
  uniform float uScreenAspect;
  uniform float uZoom;
  uniform vec2  uOffset;       // slow camera drift, in image uv

  uniform float uExposure;
  uniform float uContrast;
  uniform float uSaturation;
  uniform vec3  uTint;
  uniform float uVignette;
  uniform float uBloom;
  uniform float uBlur;
  uniform float uGrain;
  uniform float uTime;
  uniform float uReveal;       // 0 while loading -> 1 once the film is playing
  uniform vec2  uResolution;

  const int TAPS = 12;

  // Golden-angle disc — even coverage from very few samples.
  vec2 tapOffset(int i, float radius) {
    float fi = float(i) + 0.5;
    float a = fi * 2.39996323;
    float r = sqrt(fi / float(TAPS)) * radius;
    return vec2(cos(a), sin(a)) * r;
  }

  vec3 plate(vec2 uv) {
    vec3 a = texture2D(uTexA, uv).rgb;
    if (uHasB < 0.5) return a;
    return mix(a, texture2D(uTexB, uv).rgb, uMix);
  }

  vec3 plateBlur(vec2 uv, float radius) {
    if (radius < 0.0006) return plate(uv);
    vec3 sum = vec3(0.0);
    vec2 aspect = vec2(1.0, uImageAspect);
    for (int i = 0; i < TAPS; i++) {
      sum += plate(uv + tapOffset(i, radius) * aspect);
    }
    return sum / float(TAPS);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float ratio = uScreenAspect / uImageAspect;

    // "contain" keeps the entire frame visible; "cover" fills the screen.
    vec2 containScale = vec2(max(ratio, 1.0), max(1.0 / ratio, 1.0));
    vec2 coverScale   = vec2(min(ratio, 1.0), min(1.0 / ratio, 1.0));

    vec2 filmUv = c * containScale / uZoom + 0.5 + uOffset;

    // Soft feather where the plate meets the backdrop — no hard letterbox line.
    // GLSL smoothstep is undefined when edge0 >= edge1, so ramp up and invert.
    vec2 edge = abs(filmUv - 0.5);
    vec2 fw = (containScale / uZoom) / uResolution * 2.5 + 0.0022;
    float inside =
      (1.0 - smoothstep(0.5 - fw.x, 0.5, edge.x)) *
      (1.0 - smoothstep(0.5 - fw.y, 0.5, edge.y));

    vec3 color = plateBlur(clamp(filmUv, 0.0, 1.0), uBlur * 0.05);

    // Backdrop only costs anything when the screen is not 16:9.
    if (inside < 0.999) {
      vec2 backUv = c * coverScale * 1.16 + 0.5;
      vec3 back = plateBlur(clamp(backUv, 0.0, 1.0), 0.045);
      back = mix(vec3(dot(back, vec3(0.299, 0.587, 0.114))), back, 0.55);
      back *= 0.30;
      color = mix(back, color, inside);
    }

    // Soft highlight bloom — carries the candle and chandelier light.
    if (uBloom > 0.001) {
      vec3 wide = plateBlur(clamp(filmUv, 0.0, 1.0), 0.028);
      vec3 glow = max(wide - 0.62, 0.0);
      color += glow * uBloom * 1.9 * inside;
    }

    // Grade.
    color *= uExposure;
    color = (color - 0.5) * uContrast + 0.5;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, uSaturation);
    color *= uTint;

    // Vignette.
    float v = length(c * vec2(uScreenAspect / max(uScreenAspect, 1.0), 1.0));
    color *= 1.0 - uVignette * smoothstep(0.35, 0.95, v);

    // Fine film grain, animated.
    float g = hash(vUv * vec2(1024.0, 576.0) + fract(uTime) * 91.7) - 0.5;
    color += g * uGrain * (1.0 - 0.6 * dot(color, vec3(0.333)));

    color *= uReveal;

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`

/** Floating dust / light motes drifting through the frame. */
export const dustVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aDepth;

  uniform float uTime;
  uniform float uScale;
  uniform vec2  uParallax;

  varying float vAlpha;

  void main() {
    float t = uTime * (0.012 + aSeed * 0.03);
    float x = fract(position.x + t * 0.35 + sin(uTime * 0.19 + aSeed * 6.28) * 0.035);
    float y = fract(position.y + t * 0.5);

    vec2 p = vec2(x, y) * 2.0 - 1.0;
    p += uParallax * (0.4 + aDepth * 1.6);

    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = aSize * uScale * (0.45 + aDepth);
    vAlpha = (0.10 + aDepth * 0.34) * smoothstep(0.0, 0.12, y) * smoothstep(1.0, 0.88, y);
  }
`

export const dustFragmentShader = /* glsl */ `
  varying float vAlpha;
  uniform float uOpacity;
  uniform vec3  uColor;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float a = pow(1.0 - r * 2.0, 2.2);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`
