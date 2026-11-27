import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  archiveAsset,
  assignAsset,
  bulkArchiveAssets,
  bulkAssignAssets,
  bulkUpdateAssetCategory,
  createAsset,
  createAssetCategory,
  deleteAssetCategory,
  updateAssetCategory,
  fetchAllAssetCategories,
  fetchAssetHistory,
  fetchAssetHistoryFeed,
  fetchAssets,
  type AssetHistoryFeedParams,
  returnAsset,
  updateAsset,
  type AssetListParams,
} from './api'
import type { AssetCategoryWrite, AssetWrite, AssignAssetWrite } from './types'

function useOrganizationId() {
  return useAuth().user?.organizationId ?? null
}

export function assetQueryKey(organizationId: string | null, params: AssetListParams) {
  return ['assets', organizationId, params] as const
}

export function assetCategoryQueryKey(organizationId: string | null) {
  return ['asset-categories', organizationId] as const
}

function useRefreshAssets() {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['assets'] })
  }, [queryClient])
}

export function useAssetListQuery(params: AssetListParams, enabled: boolean) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: assetQueryKey(organizationId, params),
    queryFn: () => fetchAssets(params),
    enabled: enabled && Boolean(organizationId),
  })
}

export function useAssetCategoriesQuery(enabled: boolean) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: assetCategoryQueryKey(organizationId),
    queryFn: fetchAllAssetCategories,
    enabled: enabled && Boolean(organizationId),
  })
}

export function useAssetHistoryFeedQuery(params: AssetHistoryFeedParams, enabled: boolean) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: ['assets', organizationId, 'history-feed', params],
    queryFn: () => fetchAssetHistoryFeed(params),
    enabled: enabled && Boolean(organizationId),
  })
}

export function useAssetHistoryQuery(assetId: string | null) {
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: ['assets', organizationId, 'history', assetId],
    queryFn: () => {
      if (!assetId) throw new Error('Missing asset')
      return fetchAssetHistory(assetId)
    },
    enabled: Boolean(organizationId && assetId),
  })
}

export function useCreateAssetMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: (payload: AssetWrite) => createAsset(payload),
    onSuccess: () => refresh(),
  })
}

export function useUpdateAssetMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssetWrite }) => updateAsset(id, payload),
    onSuccess: () => refresh(),
  })
}

export function useArchiveAssetMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: (id: string) => archiveAsset(id),
    onSuccess: () => refresh(),
  })
}

export function useBulkUpdateCategoryMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) =>
      bulkUpdateAssetCategory(ids, categoryId),
    onSuccess: () => refresh(),
  })
}

export function useBulkAssignMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: AssignAssetWrite }) => bulkAssignAssets(ids, payload),
    onSuccess: () => refresh(),
  })
}

export function useBulkArchiveMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: (ids: string[]) => bulkArchiveAssets(ids),
    onSuccess: () => refresh(),
  })
}

export function useCreateAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssetCategoryWrite) => createAssetCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useUpdateAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssetCategoryWrite }) => updateAssetCategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useDeleteAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAssetCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useAssignAssetMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignAssetWrite }) => assignAsset(id, payload),
    onSuccess: () => refresh(),
  })
}

export function useReturnAssetMutation() {
  const refresh = useRefreshAssets()
  return useMutation({
    mutationFn: (id: string) => returnAsset(id),
    onSuccess: () => refresh(),
  })
}
