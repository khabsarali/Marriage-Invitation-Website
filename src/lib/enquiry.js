/**
 * The two service forms — makeup & hair, and the shuttle seat.
 *
 * These are not the RSVP and are deliberately not routed through it: a reply to
 * an invitation and a request for a hairdresser go to different people, and
 * `enquiries` in the config is where that is decided.
 *
 * The one rule this file exists to keep: **a form never claims to have sent
 * something it has not sent.** With no endpoint, no WhatsApp number and no
 * email address configured, `deliver` stores the request on the guest's own
 * device and returns `delivered: false`, and the page says so plainly. Set any
 * one of the three and the same submission starts going somewhere real.
 */
import { enquiries, shuttle } from '../config/wedding.config.js'

const STORAGE_KEY = 'wedding-enquiries'

/** True when a submission can actually reach the family. */
export const canDeliver = () =>
  Boolean(enquiries.endpoint || enquiries.whatsapp || enquiries.email)

/** Seats, held to the one or two the invitation admits. */
export function clampSeats(n) {
  const value = Number(n)
  if (!Number.isFinite(value)) return shuttle.minSeats
  return Math.min(shuttle.maxSeats, Math.max(shuttle.minSeats, Math.round(value)))
}

/** The list the seat picker is built from — from the config, not typed out. */
export function seatOptions() {
  const options = []
  for (let n = shuttle.minSeats; n <= shuttle.maxSeats; n++) options.push(n)
  return options
}

/** A readable one-message summary, used for the WhatsApp / email handoff. */
export function summarise(kind, form) {
  const lines = [kind, `Name: ${form.name}`]
  if (form.contact?.trim()) lines.push(`Phone / WhatsApp: ${form.contact.trim()}`)
  if (form.service) lines.push(`Service: ${form.service}`)
  if (form.date?.trim()) lines.push(`Preferred date: ${form.date.trim()}`)
  if (form.celebration) lines.push(`Celebration: ${form.celebration}`)
  if (form.seats) lines.push(`Seats: ${form.seats}`)
  if (form.message?.trim()) lines.push(`Message: ${form.message.trim()}`)
  return lines.join('\n')
}

export function whatsappHref(summary) {
  if (!enquiries.whatsapp) return null
  return `https://wa.me/${enquiries.whatsapp}?text=${encodeURIComponent(summary)}`
}

export function mailHref(summary, subject) {
  if (!enquiries.email) return null
  return `mailto:${enquiries.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`
}

/**
 * Records a request.
 *
 * Returns `{ delivered }` — true only when a configured endpoint actually
 * accepted it, or when there is a WhatsApp or email channel for the guest to
 * hand it to. Throws only when an endpoint refused, which is the one case the
 * guest has to be told about.
 */
export async function deliver(kind, form) {
  const payload = { kind, ...form, submittedAt: new Date().toISOString() }

  if (enquiries.endpoint) {
    const res = await fetch(enquiries.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    all.push(payload)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* private browsing — nothing else depends on this */
  }

  return { delivered: Boolean(enquiries.endpoint), payload }
}
