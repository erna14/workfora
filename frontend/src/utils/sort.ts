export function toggleColumnSort(current: string, field: string): string {
  const [active, direction] = current.split(',')
  if (active === field && direction === 'asc') return `${field},desc`
  if (active === field && direction === 'desc') return `${field},asc`
  return `${field},asc`
}
