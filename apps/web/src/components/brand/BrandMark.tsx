/**
 * Mélampus brand mark — plaque arrondie + tracé ECG-M.
 * La seule source de vérité visuelle pour le logo dans l'app web.
 */

interface BrandMarkProps {
  size?: number
  /** `on-paper` : mark vert sur fond clair · `on-deep` : mark crème sur fond marque */
  variant?: 'on-paper' | 'on-deep' | 'on-ink' | 'outline'
  withWordmark?: boolean
  className?: string
}

const PALETTE = {
  brand: '#0E5B45',
  deep: '#07382B',
  paper: '#FAFAF7',
  ink: '#0F1A16',
}

export function BrandMark({
  size = 40,
  variant = 'on-paper',
  withWordmark = false,
  className = '',
}: BrandMarkProps) {
  const cfg = {
    'on-paper': { bg: PALETTE.brand, stroke: PALETTE.paper, word: PALETTE.ink },
    'on-deep': { bg: PALETTE.paper, stroke: PALETTE.brand, word: PALETTE.paper },
    'on-ink': { bg: PALETTE.ink, stroke: PALETTE.paper, word: PALETTE.paper },
    outline: { bg: 'transparent', stroke: PALETTE.deep, word: PALETTE.ink },
  }[variant]

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Mélampus"
        role="img"
      >
        {variant === 'outline' ? (
          <rect x="1" y="1" width="62" height="62" rx="13" ry="13" fill="none" stroke={cfg.stroke} strokeWidth="2" />
        ) : (
          <rect width="64" height="64" rx="14" ry="14" fill={cfg.bg} />
        )}
        <path
          d="M8 42 L22 42 L26 18 L32 42 L38 18 L42 42 L56 42"
          fill="none"
          stroke={cfg.stroke}
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      {withWordmark && (
        <span
          className="font-sans font-semibold tracking-tightish"
          style={{ color: cfg.word, fontSize: Math.round(size * 0.6), lineHeight: 1 }}
        >
          mélampus
        </span>
      )}
    </span>
  )
}
