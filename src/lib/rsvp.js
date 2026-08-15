/**
 * Where a reply goes, for both response cards — the short one on the invitation
 * and the full one at /rsvp.
 *
 * It lives here rather than in either component so the two can never drift
 * apart: one delivery path, one storage key, one summary wording. Behaviour is
 * exactly what the invitation's card has always done — POST to `endpoint` when
 * one is configured, keep a copy in localStorage either way, and offer WhatsApp
 * and email as the fallback. With all three unset the reply is still
 * acknowledged and stored, so the form is never a dead end while the family
 * decides where replies should go.
 *
 * There is no backend in this project and none is faked here. Set
 * `rsvp.endpoint` in the config and the same form starts posting to it.
 */
import { rsvp as rsvpConfig, coupleNames } from '../config/wedding.config.js'

const STORAGE_KEY = 'wedding-rsvp'

/** Never below one guest, never above the cap, never a non-number. */
export function clampGuests(n) {
  const value = Number(n)
  if (!Number.isFinite(value)) return rsvpConfig.minGuests
  return Math.min(rsvpConfig.maxGuests, Math.max(rsvpConfig.minGuests, Math.round(value)))
}

/** The list the pickers are built from — 1 and 2, from the config, not typed out. */
export function guestOptions() {
  const options = []
  for (let n = rsvpConfig.minGuests; n <= rsvpConfig.maxGuests; n++) options.push(n)
  return options
}

/** A readable one-message summary, used for the WhatsApp / email handoff. */
export function summarise(form) {
  const lines = [`RSVP for ${coupleNames[0]} & ${coupleNames[1]}`, `Name: ${form.name}`]
  if (form.contact?.trim()) lines.push(`Contact: ${form.contact.trim()}`)
  lines.push(
    form.attending === 'yes'
      ? `Attending: Joyfully — ${form.guests} ${form.guests === 1 ? 'guest' : 'guests'}`
      : 'Attending: Regretfully unable'
  )
  if (form.attending === 'yes' && form.celebration) lines.push(`Celebration: ${form.celebration}`)
  if (form.message?.trim()) lines.push(`Message: ${form.message.trim()}`)
  return lines.join('\n')
}

export function whatsappHref(summary) {
  if (!rsvpConfig.whatsapp) return null
  return `https://wa.me/${rsvpConfig.whatsapp}?text=${encodeURIComponent(summary)}`
}

export function mailHref(summary, name) {
  if (!rsvpConfig.email) return null
  const subject = encodeURIComponent(`RSVP — ${name || 'Wedding'}`)
  return `mailto:${rsvpConfig.email}?subject=${subject}&body=${encodeURIComponent(summary)}`
}

/**
 * Sends a reply. Resolves when it has been recorded somewhere; throws only when
 * a configured endpoint refused it, which is the one case the guest has to be
 * told about — the WhatsApp and email buttons are the way out of that.
 */
export async function deliver(form) {
  const payload = { ...form, guests: clampGuests(form.guests), submittedAt: new Date().toISOString() }

  if (rsvpConfig.endpoint) {
    const res = await fetch(rsvpConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* private browsing — the reply still went through */
  }

  return payload
}
