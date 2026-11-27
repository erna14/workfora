import { api } from '../../services/apiClient'
import type { ApiResponse, PageResponse } from '../../types/api'
import { toSearchParams } from '../../utils/queryParams'
import { CATEGORY_PAGE_SIZE } from './structure'
import type {
  Asset,
  AssetAssignment,
  AssetCategory,
  AssetCategoryWrite,
  AssetHistory,
  AssetWrite,
  AssignAssetWrite,
  BulkResult,
  HistoryFeedItem,
} from './types'

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data
  }
  return response as T
}

export interface AssetListParams {
  page: number
  size: number
  sort?: string
  archived?: boolean
}

export async function fetchAssets(params: AssetListParams) {
  return api.get<PageResponse<Asset>>(
    `/assets${toSearchParams({
      page: params.page,
      size: params.size,
      sort: params.sort,
      archived: params.archived ? true : undefined,
    })}`,
  )
}

export async function fetchAssetCategories(page: number) {
  return api.get<PageResponse<AssetCategory>>(
    `/assets/categories${toSearchParams({ page, size: CATEGORY_PAGE_SIZE })}`,
  )
}

export async function fetchAllAssetCategories() {
  const first = await fetchAssetCategories(0)
  const categories = [...first.data]
  for (let page = 1; page < first.meta.totalPages; page += 1) {
    const next = await fetchAssetCategories(page)
    categories.push(...next.data)
  }
  return categories
}

export async function createAsset(payload: AssetWrite) {
  return unwrap(await api.post<ApiResponse<Asset>>('/assets', payload))
}

export async function updateAsset(id: string, payload: AssetWrite) {
  return unwrap(await api.put<ApiResponse<Asset>>(`/assets/${id}`, payload))
}

export async function archiveAsset(id: string) {
  return unwrap(await api.delete<ApiResponse<Asset>>(`/assets/${id}`))
}

export async function fetchAssetHistory(id: string) {
  return unwrap(await api.get<ApiResponse<AssetHistory>>(`/assets/${id}/history`))
}

export interface AssetHistoryFeedParams {
  page: number
  size: number
  search?: string
  type?: string
  assetId?: string
}

export async function fetchAssetHistoryFeed(params: AssetHistoryFeedParams) {
  return api.get<PageResponse<HistoryFeedItem>>(
    `/assets/history${toSearchParams({
      page: params.page,
      size: params.size,
      search: params.search,
      type: params.type,
      assetId: params.assetId,
    })}`,
  )
}

export async function bulkUpdateAssetCategory(ids: string[], categoryId: string | null) {
  return unwrap(
    await api.patch<ApiResponse<BulkResult>>('/assets/bulk', {
      ids,
      categoryId,
      clearCategory: categoryId == null,
    }),
  )
}

export async function bulkAssignAssets(ids: string[], payload: AssignAssetWrite) {
  return unwrap(
    await api.post<ApiResponse<BulkResult>>('/assets/bulk/assign', {
      ids,
      employeeId: payload.employeeId,
      notes: payload.notes,
    }),
  )
}

export async function bulkArchiveAssets(ids: string[]) {
  return unwrap(await api.post<ApiResponse<BulkResult>>('/assets/bulk/archive', { ids }))
}

export async function createAssetCategory(payload: AssetCategoryWrite) {
  return unwrap(await api.post<ApiResponse<AssetCategory>>('/assets/categories', payload))
}

export async function updateAssetCategory(id: string, payload: AssetCategoryWrite) {
  return unwrap(await api.put<ApiResponse<AssetCategory>>(`/assets/categories/${id}`, payload))
}

export async function deleteAssetCategory(id: string) {
  return unwrap(await api.delete<ApiResponse<AssetCategory>>(`/assets/categories/${id}`))
}

export async function assignAsset(id: string, payload: AssignAssetWrite) {
  return unwrap(await api.post<ApiResponse<AssetAssignment>>(`/assets/${id}/assign`, payload))
}

export async function returnAsset(id: string) {
  return unwrap(await api.post<ApiResponse<AssetAssignment>>(`/assets/${id}/return`))
}
