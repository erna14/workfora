interface WorkforaMarkProps {
  size?: number
  className?: string
}

/** Compact brand mark used on auth and shell surfaces. */
export function WorkforaMark({ size = 28, className }: WorkforaMarkProps) {
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
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.12" />
      <path
        d="M8 22V10h2.4l3.2 7.6L17 10H19.4v12H17.1V14.2L14 21.2h-1.6L9.3 14.2V22H8Zm14.2 0-3.4-12h2.5l2.1 8.2 2.1-8.2h2.4L22.5 22h-2.3Z"
        fill="currentColor"
      />
    </svg>
  )
}
