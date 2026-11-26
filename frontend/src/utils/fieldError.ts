function hasMessage(value: object): value is { message: unknown } {
  return 'message' in value
}

/** First TanStack Form or Zod field error, as text. */
export function fieldError(errors: unknown[]): string | undefined {
  const first = errors[0]
  if (!first) return undefined
  if (typeof first === 'string') return first
  if (typeof first === 'object' && hasMessage(first)) return String(first.message)
  return String(first)
}
