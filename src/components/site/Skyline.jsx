/**
 * Dubai and Karachi, drawn as engravings.
 *
 * There is no city photography in this project, and a stock skyline shot would
 * be the one cheap thing on an otherwise printed-looking page. Fine line work
 * belongs to the same world as the invitation itself, so each city is drawn
 * instead: single-weight strokes, a horizon, and one landmark that names the
 * place without a caption.
 *
 *   Dubai   — the low-rise creek, the Emirates towers, Burj Al Arab's sail and
 *             Burj Khalifa stepping up to its needle.
 *   Karachi — a dhow on the Arabian Sea, the Quaid's mausoleum under its dome,
 *             Habib Bank Plaza and the MCB tower.
 *
 * Both are drawn into the same 400×180 box with the horizon at y=160, so the two
 * panels line up on the same ground line whatever width they end up.
 *
 * If real photography arrives, set `image` on the city in wedding.config.js —
 * the panel swaps the engraving for the photograph and nothing else changes.
 */

const DUBAI = (
  <>
    {/* The moon, behind everything. */}
    <circle cx="212" cy="52" r="40" className="skyline__moon" />

    {/* Creek-side low rise. */}
    <path d="M24 160V132h20v28M50 160v-42h16v42M58 118v-11M72 160v-20h16v20M94 160v-36h18v36M118 160v-14h12v14" />

    {/* Emirates towers. */}
    <path d="M136 160l2-86 12-22 12 22 2 86M170 160l2-64 9-16 9 16 2 64" />

    {/* Burj Khalifa. */}
    <path d="M192 160v-50h4V80h3.5V56h3.5V36h3V22h3.5V10L212 2l2.5 8v12h3.5v14h3v20h3.5v24h3.5v30h4v50" />

    {/* Two mid-rises between the towers. */}
    <path d="M240 160v-40h16v40M258 160v-24h8v24" />

    {/* Burj Al Arab's sail. */}
    <path d="M272 160c0-50 4-96 15-128 11 32 19 78 19 128" />
    <path d="M278 124h25" className="skyline__detail" />

    {/* Marina. */}
    <path d="M312 160v-32h16v32M334 160v-48h12v48M340 112v-12M352 160v-22h18v22M374 160v-12h10v12" />

    {/* Horizon, and the water beyond it. */}
    <path d="M8 160h384" className="skyline__ground" />
    <path d="M18 168h44M74 168h30M28 174h38M112 168h22" className="skyline__water" />
  </>
)

const KARACHI = (
  <>
    <circle cx="300" cy="56" r="40" className="skyline__moon" />

    {/* A dhow on the sea. */}
    <path d="M42 152h30l-5 8H47zM57 148v-40l17 40M54 148v-28l-13 28" />

    {/* Low rise along the coast road. */}
    <path d="M92 160v-26h14v26M110 160v-16h10v16M124 160v-34h16v34" />

    {/* Mazar-e-Quaid — the mausoleum, its dome and finial. */}
    <path d="M150 160v-50h60v50" />
    <path d="M152 110c0-34 12-50 28-50s28 16 28 50" />
    <path d="M180 60V49" />
    <circle cx="180" cy="45" r="3" />
    <path d="M162 160v-24c0-8 12-8 12 0v24M186 160v-24c0-8 12-8 12 0v24" className="skyline__detail" />

    {/* Habib Bank Plaza. */}
    <path d="M240 160V60h28v100M254 60V46" />
    <path d="M240 92h28M240 124h28" className="skyline__detail" />

    {/* The MCB tower. */}
    <path d="M292 160V44l4-8h16l4 8v116" />

    {/* Clifton, and the towers along the shore. */}
    <path d="M330 160v-30h14v30M348 160v-44h12v44M354 116v-10M366 160v-20h18v20" />

    <path d="M8 160h384" className="skyline__ground" />
    <path d="M20 168h40M70 168h26M32 174h34M106 168h20" className="skyline__water" />
  </>
)

const DRAWINGS = { dubai: DUBAI, karachi: KARACHI }

export default function Skyline({ name, className = '' }) {
  const drawing = DRAWINGS[name]
  if (!drawing) return null

  return (
    <svg
      className={`skyline ${className}`.trim()}
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      {drawing}
    </svg>
  )
}
