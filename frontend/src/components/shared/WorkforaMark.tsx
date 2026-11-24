import { useId } from 'react'

interface WorkforaMarkProps {
  size?: number
  className?: string
}

/** Compact brand mark used on auth and shell surfaces. */
export function WorkforaMark({ size = 28, className }: WorkforaMarkProps) {
  const maskId = `workfora-mark-${useId().replace(/:/g, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <mask id={maskId}>
        <rect width="32" height="32" rx="9" fill="white" />
        <path
          d="M8.25 9.6 12.2 22.6 16 15.15 19.8 22.6 23.75 9.6"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <rect width="32" height="32" rx="9" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
