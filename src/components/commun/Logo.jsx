/*
 * Logo NBM (docs/DESIGN.md §5) : deux montants et une diagonale dorée.
 * `inverse` : carré foncé et montants clairs (page de connexion).
 */
export function Logo({ taille = 34, inverse = false, className }) {
  const fond = inverse ? 'var(--strong)' : 'var(--bg)'
  const trait = inverse ? 'var(--bg)' : 'var(--strong)'
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect width="48" height="48" rx="12" fill={fond} />
      <rect x="11" y="11" width="7" height="26" rx="2" fill={trait} />
      <rect x="30" y="11" width="7" height="26" rx="2" fill={trait} />
      <path
        d="M13.5 15v6M13.5 26v7M32.5 15v8M32.5 28v5"
        stroke={fond}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M11.6 12.6 Q12.5 11 14.4 11 L16.6 11 Q18 11 18.8 12.2 L36.4 35.4 Q37 37 35.2 37 L32.4 37 Q31 37 30.2 35.8 Z"
        fill="var(--gold)"
      />
    </svg>
  )
}
