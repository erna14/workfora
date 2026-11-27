import type { Asset, AssetHistoryEvent, AssetStatus, BulkResult } from './types'

export const ASSET_PAGE_SIZE = 20
export const CATEGORY_PAGE_SIZE = 50

export const assetStatusOptions: Array<{ value: AssetStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
]

export const assetSortOptions = [
  { value: 'name,asc', label: 'Name (A–Z)' },
  { value: 'name,desc', label: 'Name (Z–A)' },
  { value: 'assetTag,asc', label: 'Tag (A–Z)' },
  { value: 'assetTag,desc', label: 'Tag (Z–A)' },
  { value: 'status,asc', label: 'Status (assigned first)' },
  { value: 'status,desc', label: 'Status (available first)' },
  { value: 'purchaseDate,desc', label: 'Purchase date (newest)' },
  { value: 'purchaseDate,asc', label: 'Purchase date (oldest)' },
  { value: 'purchaseCost,desc', label: 'Purchase cost (highest)' },
  { value: 'purchaseCost,asc', label: 'Purchase cost (lowest)' },
]

export function categoryLabel(categoryId: string | null, names: ReadonlyMap<string, string>): string {
  if (!categoryId) return 'Uncategorized'
  return names.get(categoryId) ?? 'Unknown category'
}

export function assigneeLabel(asset: Pick<Asset, 'status' | 'currentAssignment'>): string {
  if (asset.currentAssignment) {
    return `${asset.currentAssignment.fullName} · ${asset.currentAssignment.employeeNumber}`
  }
  return asset.status === 'ASSIGNED' ? 'Assignment details unavailable' : 'Not assigned'
}

export interface AssetFilters {
  search: string
  categoryId: string | null
  status: AssetStatus | null
}

export function filterAssets(assets: readonly Asset[], filters: AssetFilters): Asset[] {
  const search = filters.search.trim().toLowerCase()
  return assets.filter((asset) => {
    if (filters.status && asset.status !== filters.status) return false
    if (filters.categoryId && asset.categoryId !== filters.categoryId) return false
    if (!search) return true
    const assignee = asset.currentAssignment
    return [asset.name, asset.assetTag, asset.serialNumber ?? '', assignee?.fullName ?? '', assignee?.employeeNumber ?? ''].some(
      (value) => value.toLowerCase().includes(search),
    )
  })
}

export interface AssetPageSummary {
  scope: 'organization' | 'page'
  total: number
  available: number
  assigned: number
  purchaseValue: number
  missingCost: number
}

export function summarizeAssets(
  pageRows: readonly Asset[],
  totalElements: number,
  singlePage: boolean,
): AssetPageSummary {
  let available = 0
  let assigned = 0
  let purchaseValue = 0
  let missingCost = 0
  for (const asset of pageRows) {
    if (asset.status === 'AVAILABLE') available += 1
    if (asset.status === 'ASSIGNED') assigned += 1
    if (asset.purchaseCost == null) missingCost += 1
    else purchaseValue += asset.purchaseCost
  }
  return {
    scope: singlePage ? 'organization' : 'page',
    total: totalElements,
    available,
    assigned,
    purchaseValue,
    missingCost,
  }
}

export function formatPurchaseCost(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  assetTag: 'Asset tag',
  category: 'Category',
  serialNumber: 'Serial number',
  purchaseDate: 'Purchase date',
  purchaseCost: 'Purchase cost',
  notes: 'Notes',
}

export function historyTitle(event: AssetHistoryEvent): string {
  if (event.type === 'UPDATED') return `${FIELD_LABELS[event.field ?? ''] ?? 'Detail'} changed`
  if (event.type === 'CREATED') return 'Asset created'
  if (event.type === 'ARCHIVED') return 'Asset archived'
  if (event.type === 'ASSIGNED') return 'Assigned'
  if (event.type === 'RETURNED') return 'Returned'
  return event.type
}

export function historyDetail(event: AssetHistoryEvent, now = Date.now()): string {
  if (event.type === 'UPDATED') {
    return `${shown(event.previousValue)} → ${shown(event.newValue)}`
  }
  if (event.type === 'ASSIGNED' || event.type === 'RETURNED') {
    const who = event.employeeName
      ? `${event.employeeName}${event.employeeNumber ? ` · ${event.employeeNumber}` : ''}`
      : 'Employee'
    const end = event.type === 'RETURNED' ? event.returnedAt : null
    const duration = event.assignedAt ? assignmentDuration(event.assignedAt, end, now) : ''
    const held = duration ? ` Held for ${duration}.` : ''
    const note = event.notes ? ` Note: ${event.notes}` : ''
    const actor = event.actorName ? ` By ${event.actorName}.` : ''
    return `${who}.${held}${note}${actor}`.replace(/\s+/g, ' ').trim()
  }
  if (event.type === 'CREATED') {
    return event.actorName ? `Created by ${event.actorName}` : 'Added to the inventory'
  }
  if (event.type === 'ARCHIVED') {
    return event.actorName
      ? `Archived by ${event.actorName}. The asset leaves the active inventory and its history stays available.`
      : 'Removed from the active inventory. History stays available.'
  }
  return ''
}

function shown(value: string | null): string {
  return value == null || value === '' ? 'Empty' : value
}

export function assignmentDuration(start: string, end: string | null, now = Date.now()): string {
  const from = new Date(start).getTime()
  const to = end ? new Date(end).getTime() : now
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return ''
  const minutes = Math.floor((to - from) / 60000)
  if (minutes < 1) return 'less than a minute'
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (!days && mins) parts.push(`${mins}m`)
  return parts.join(' ')
}

export function bulkResultMessage(
  action: string,
  result: BulkResult,
  names: ReadonlyMap<string, string>,
): { color: 'green' | 'yellow' | 'red'; message: string } {
  const failures = result.items
    .filter((item) => !item.success)
    .map((item) => `${names.get(item.id) ?? 'Asset'}: ${item.message}`)
  if (result.failed === 0) {
    const count = result.succeeded
    return { color: 'green', message: count === 1 ? `${action} 1 asset` : `${action} ${count} assets` }
  }
  if (result.succeeded === 0) {
    return { color: 'red', message: failures.join(' ') || `${action} failed` }
  }
  return { color: 'yellow', message: `${action} ${result.succeeded}. ${failures.join(' ')}` }
}

export function formatPurchaseDate(value: string | null): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}
