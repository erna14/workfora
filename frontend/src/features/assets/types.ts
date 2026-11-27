export const ASSET_STATUSES = ['AVAILABLE', 'ASSIGNED'] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]

export interface CurrentAssignment {
  employeeId: string
  fullName: string
  employeeNumber: string
  assignedAt: string
}

export interface Asset {
  id: string
  categoryId: string | null
  assetTag: string
  name: string
  serialNumber: string | null
  status: string
  purchaseDate: string | null
  purchaseCost: number | null
  notes: string | null
  archivedAt: string | null
  currentAssignment: CurrentAssignment | null
}

export interface AssetWrite {
  assetTag: string
  name: string
  categoryId: string | null
  serialNumber: string | null
  purchaseDate: string | null
  purchaseCost: number | null
  notes: string | null
}

export interface AssetCategory {
  id: string
  name: string
  description: string | null
}

export interface AssetCategoryWrite {
  name: string
  description: string | null
}

export interface AssetAssignment {
  id: string
  assetId: string
  employeeId: string
  assignedAt: string
  returnedAt: string | null
  notes: string | null
}

export interface AssignAssetWrite {
  employeeId: string
  notes: string | null
}

export interface BulkItemResult {
  id: string
  success: boolean
  message: string
}

export interface BulkResult {
  succeeded: number
  failed: number
  items: BulkItemResult[]
}

export interface AssetHistoryEvent {
  type: string
  occurredAt: string
  actorUserId: string | null
  actorName: string | null
  field: string | null
  previousValue: string | null
  newValue: string | null
  employeeId: string | null
  employeeName: string | null
  employeeNumber: string | null
  assignedAt: string | null
  returnedAt: string | null
  notes: string | null
}

export interface AssetHistory {
  assetId: string
  assetName: string
  assetTag: string
  status: string
  archivedAt: string | null
  currentAssignment: CurrentAssignment | null
  events: AssetHistoryEvent[]
}

export interface HistoryFeedItem {
  assetId: string
  assetName: string
  assetTag: string
  assetStatus: string
  archivedAt: string | null
  event: AssetHistoryEvent
}
