import type { ReactNode } from 'react'

// One small line drawing per piece of equipment, so a person can tell what "Hack squat" or
// "T-bar row" is. Same drawing language as the rest of the app (DESIGN.md): 2px strokes, round
// caps and joins, no fill, one colour (whatever text colour the parent sets). 64 x 48 canvas.
// Machines share a weight stack on the right and face left, so the moving parts stand out.

/** The weight stack that most machines have on their right. */
const Stack = () => (
  <>
    <rect x="51" y="8" width="9" height="35" rx="1.5" />
    <path d="M51 17h9M51 26h9M51 35h9" />
  </>
)

const ART: Record<string, ReactNode> = {
  // ---- Free weights ----
  barbell: (
    <>
      <path d="M3 24h5M18 24h28M56 24h5" />
      <rect x="8" y="11" width="5" height="26" rx="1.5" />
      <rect x="14" y="16" width="4" height="16" rx="1.5" />
      <rect x="46" y="16" width="4" height="16" rx="1.5" />
      <rect x="51" y="11" width="5" height="26" rx="1.5" />
    </>
  ),
  'ez-bar': (
    <>
      <path d="M4 24h10l5-9 7 18 7-18 7 18 5-9h11" />
      <path d="M4 19v10M60 19v10" />
    </>
  ),
  dumbbells: (
    <>
      <rect x="4" y="17" width="6" height="14" rx="2" />
      <rect x="11" y="12" width="7" height="24" rx="2" />
      <path d="M18 24h28" />
      <rect x="46" y="12" width="7" height="24" rx="2" />
      <rect x="54" y="17" width="6" height="14" rx="2" />
    </>
  ),
  kettlebell: (
    <>
      <circle cx="32" cy="31" r="12" />
      <path d="M24 23V14a8 8 0 0 1 16 0v9" />
    </>
  ),
  'weight-plates': (
    <>
      <circle cx="32" cy="24" r="19" />
      <circle cx="32" cy="24" r="13" />
      <circle cx="32" cy="24" r="4" />
      <path d="M11 24h2M51 24h2" />
    </>
  ),

  // ---- Benches and racks ----
  'flat-bench': (
    <>
      <rect x="6" y="18" width="52" height="8" rx="3" />
      <path d="M15 26v13M49 26v13M10 39h10M44 39h10" />
    </>
  ),
  'adjustable-bench': (
    <>
      <path d="M4 16L8 10l21 15-4 6z" />
      <rect x="30" y="24" width="24" height="7" rx="3.5" />
      <path d="M38 31v8M33 39h10M17 27l8 12M21 39h8" />
    </>
  ),
  'preacher-bench': (
    <>
      <path d="M5 13l4-6 25 16-4 6z" />
      <rect x="38" y="28" width="17" height="6" rx="3" />
      <path d="M46 34v9M22 22v21M14 43h42" />
    </>
  ),
  'hyperextension-bench': (
    <>
      <path d="M7 15l5-6 28 17-4 6z" />
      <path d="M45 30h10v6H45zM14 23v20M40 32v11M8 43h48" />
    </>
  ),
  'squat-rack': (
    <>
      <path d="M14 6v37M50 6v37M14 6h36M8 43h12M44 43h12M14 32h9M50 32h-9" />
      <path d="M4 15h56" />
      <rect x="5" y="9" width="3.5" height="12" rx="1" />
      <rect x="55.5" y="9" width="3.5" height="12" rx="1" />
    </>
  ),
  'smith-machine': (
    <>
      <path d="M16 4v39M48 4v39M8 43h48" />
      <path d="M8 21h48" />
      <rect x="13" y="18" width="6" height="6" rx="1" />
      <rect x="45" y="18" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="3.5" height="14" rx="1" />
      <rect x="56.5" y="14" width="3.5" height="14" rx="1" />
    </>
  ),

  // ---- Bodyweight ----
  'pull-up-bar': (
    <>
      <path d="M12 44V8M52 44V8M6 8h52" />
      <path d="M6 8v6M58 8v6" />
    </>
  ),
  'dip-bars': (
    <>
      <path d="M4 26h38M20 15h40" />
      <path d="M4 26L4 22M42 26v-4M20 15v-4M60 15v-4" />
      <path d="M11 26v17M35 26v17M6 43h12M29 43h12M27 15v12M53 15v12" />
    </>
  ),

  // ---- Cable ----
  'cable-machine': (
    <>
      <rect x="44" y="4" width="14" height="39" rx="2" />
      <path d="M44 30h14M44 36h14M48 9v14" />
      <rect x="35" y="9" width="9" height="6" rx="2" />
      <circle cx="35" cy="12" r="2.5" />
      <path d="M33 14L22 34M17 35h11M17 32v6M28 32v6" />
    </>
  ),
  'cable-crossover': (
    <>
      <rect x="4" y="4" width="8" height="39" rx="1.5" />
      <rect x="52" y="4" width="8" height="39" rx="1.5" />
      <path d="M4 4h56" />
      <path d="M12 8L27 27M52 8L37 27" />
      <circle cx="28" cy="29" r="2.5" />
      <circle cx="36" cy="29" r="2.5" />
    </>
  ),
  'lat-pulldown': (
    <>
      <rect x="50" y="4" width="10" height="39" rx="1.5" />
      <path d="M50 14h10M50 22h10" />
      <path d="M50 8H26M26 8v9M12 17h28M12 17v5M40 17v5" />
      <rect x="22" y="33" width="20" height="6" rx="3" />
      <path d="M32 39v4M16 43h32" />
    </>
  ),
  'seated-cable-row': (
    <>
      <rect x="52" y="14" width="8" height="29" rx="1.5" />
      <path d="M52 30H14M12 25v10" />
      <rect x="28" y="34" width="16" height="5" rx="2.5" />
      <path d="M36 39v4M4 22v21M4 43h32" />
    </>
  ),

  // ---- Upper body machines ----
  'chest-press-machine': (
    <>
      <Stack />
      <rect x="38" y="10" width="6" height="24" rx="3" />
      <rect x="20" y="33" width="18" height="6" rx="3" />
      <path d="M29 39v4M12 43h34M38 22H10M10 17v10" />
    </>
  ),
  'pec-deck': (
    <>
      <Stack />
      <rect x="38" y="10" width="6" height="24" rx="3" />
      <rect x="20" y="33" width="18" height="6" rx="3" />
      <path d="M29 39v4M12 43h34M38 16Q12 16 14 30" />
      <rect x="10" y="24" width="8" height="10" rx="3" />
    </>
  ),
  'shoulder-press-machine': (
    <>
      <Stack />
      <rect x="38" y="12" width="6" height="24" rx="3" />
      <rect x="20" y="35" width="18" height="6" rx="3" />
      <path d="M30 41v2M12 43h34M38 12L16 8M15 4v10" />
    </>
  ),
  'lateral-raise-machine': (
    <>
      <Stack />
      <rect x="38" y="12" width="6" height="24" rx="3" />
      <rect x="20" y="35" width="18" height="6" rx="3" />
      <path d="M30 41v2M12 43h34M38 28Q22 28 16 12" />
      <rect x="10" y="6" width="8" height="10" rx="3" />
    </>
  ),
  'rear-delt-machine': (
    <>
      <Stack />
      <rect x="16" y="10" width="6" height="24" rx="3" />
      <rect x="20" y="35" width="24" height="6" rx="3" />
      <path d="M32 41v2M12 43h34M50 14L38 14Q30 14 26 20M26 20l-4 8" />
      <circle cx="26" cy="22" r="2.5" />
    </>
  ),
  'assisted-pullup-machine': (
    <>
      <rect x="50" y="4" width="10" height="39" rx="1.5" />
      <path d="M50 12h10M50 20h10" />
      <path d="M50 8H14M14 8v7M34 8v7" />
      <rect x="14" y="32" width="24" height="5" rx="2.5" />
      <path d="M38 34h12M26 37v6M10 43h30" />
    </>
  ),
  'seated-row-machine': (
    <>
      <Stack />
      <rect x="6" y="12" width="6" height="24" rx="3" />
      <rect x="22" y="35" width="20" height="6" rx="3" />
      <path d="M32 41v2M12 43h34M51 22H20M20 17v10" />
    </>
  ),
  't-bar-row': (
    <>
      <path d="M8 40L50 22" />
      <circle cx="13" cy="36" r="8" />
      <circle cx="13" cy="36" r="2" />
      <path d="M46 14v16M42 14h8" />
      <path d="M4 44h56" />
    </>
  ),
  'biceps-curl-machine': (
    <>
      <Stack />
      <path d="M5 14l4-6 24 14-4 6z" />
      <rect x="34" y="30" width="16" height="6" rx="3" />
      <path d="M42 36v7M18 22v21M12 43h38" />
      <circle cx="5" cy="24" r="2.5" />
    </>
  ),
  'triceps-extension-machine': (
    <>
      <Stack />
      <rect x="38" y="12" width="6" height="24" rx="3" />
      <rect x="20" y="35" width="18" height="6" rx="3" />
      <path d="M30 41v2M12 43h34M38 12H20M20 12v16M14 28h12" />
    </>
  ),

  // ---- Lower body machines ----
  'leg-press': (
    <>
      <path d="M3 43L58 13" />
      <rect x="10" y="17" width="6" height="22" rx="3" transform="rotate(-28.6 13 28)" />
      <rect x="17" y="22" width="14" height="5" rx="2.5" transform="rotate(-28.6 24 24.5)" />
      <rect x="43" y="1" width="6" height="22" rx="3" transform="rotate(-28.6 46 12)" />
      <path d="M4 44h14M44 26v18M38 44h14" />
    </>
  ),
  'hack-squat': (
    <>
      <path d="M8 43h50M16 43L47 6" />
      <rect x="27" y="14" width="6" height="26" rx="3" transform="rotate(39.5 30 27)" />
      <rect x="35" y="8" width="7" height="10" rx="3" transform="rotate(39.5 38 13)" />
      <path d="M36 43l10-13M46 30h8" />
    </>
  ),
  'leg-extension-machine': (
    <>
      <Stack />
      <rect x="40" y="8" width="6" height="26" rx="3" />
      <rect x="22" y="28" width="20" height="6" rx="3" />
      <path d="M32 34v9M12 43h34M24 32L14 42" />
      <circle cx="12" cy="43" r="3" />
    </>
  ),
  'leg-curl-machine': (
    <>
      <Stack />
      <rect x="8" y="26" width="38" height="7" rx="3.5" />
      <path d="M16 33v10M38 33v10M8 43h38M46 28L48 14" />
      <circle cx="48" cy="12" r="3.5" />
    </>
  ),
  'hip-thrust-machine': (
    <>
      <rect x="4" y="21" width="15" height="7" rx="3.5" />
      <path d="M11 28v15M4 43h54" />
      <path d="M54 43V27Q54 13 40 15L34 16" />
      <rect x="24" y="12" width="11" height="7" rx="3.5" />
      <circle cx="54" cy="27" r="2" />
    </>
  ),
  'hip-abductor': (
    <>
      <rect x="27" y="6" width="10" height="26" rx="4" />
      <rect x="18" y="32" width="28" height="6" rx="3" />
      <rect x="4" y="18" width="8" height="16" rx="3" />
      <rect x="52" y="18" width="8" height="16" rx="3" />
      <path d="M12 26h8M52 26h-8M32 38v5M14 43h36" />
    </>
  ),
  'hip-adductor': (
    <>
      <rect x="27" y="6" width="10" height="26" rx="4" />
      <rect x="18" y="32" width="28" height="6" rx="3" />
      <rect x="14" y="18" width="8" height="16" rx="3" />
      <rect x="42" y="18" width="8" height="16" rx="3" />
      <path d="M6 26h8M58 26h-8M32 38v5M14 43h36" />
    </>
  ),
  'calf-raise-machine': (
    <>
      <Stack />
      <rect x="14" y="8" width="20" height="7" rx="3.5" />
      <path d="M18 15v24M30 15v24M51 36H30" />
      <rect x="8" y="37" width="30" height="6" rx="2" />
    </>
  ),

  // ---- Core and accessories ----
  'ab-crunch-machine': (
    <>
      <Stack />
      <rect x="38" y="22" width="6" height="14" rx="3" />
      <rect x="20" y="35" width="20" height="6" rx="3" />
      <path d="M30 41v2M12 43h34M28 30L20 12M20 12h-8" />
      <rect x="6" y="8" width="8" height="10" rx="3" />
    </>
  ),
  'ab-wheel': (
    <>
      <circle cx="32" cy="26" r="14" />
      <circle cx="32" cy="26" r="3.5" />
      <path d="M8 26h21M35 26h21M8 20v12M56 20v12" />
    </>
  ),
  'resistance-bands': (
    <>
      <path d="M11 34C11 8 53 8 53 34" />
      <rect x="4" y="32" width="13" height="6" rx="3" />
      <rect x="47" y="32" width="13" height="6" rx="3" />
    </>
  ),
  'medicine-ball': (
    <>
      <circle cx="32" cy="24" r="18" />
      <path d="M14 24h36M32 6v36" />
      <path d="M19 11q12 13 0 26M45 11q-12 13 0 26" />
    </>
  ),
  'stability-ball': (
    <>
      <circle cx="32" cy="23" r="19" />
      <path d="M19 15q6-7 15-7" />
      <path d="M18 44h28" />
    </>
  ),
}

/** The drawing for an equipment id. An id without a drawing (a future custom item) gets a plain dumbbell. */
export function EquipmentIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ART[id] ?? ART.dumbbells}
    </svg>
  )
}
