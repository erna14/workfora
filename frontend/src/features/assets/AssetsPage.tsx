import { ActionIcon, Button, Checkbox, Group, Paper, Select, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useForm } from '@tanstack/react-form'
import { Archive, Banknote, History, Package, PackageCheck, Pencil, Plus, Search, Tags, Undo2, UserCheck, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../app/providers/AuthProvider'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { AppDrawer } from '../../components/ui/AppDrawer'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { TableBulkActions } from '../../components/ui/TableBulkActions'
import { TableFilterActions } from '../../components/ui/TableFilterActions'
import { TableToolbar } from '../../components/ui/TableToolbar'
import { useRowSelection } from '../../components/ui/useRowSelection'
import { fieldError } from '../../utils/fieldError'
import { errorMessage, formatDateTime } from '../../utils/format'
import { AssetForm } from './AssetForm'
import { AssignAssetForm } from './AssignAssetForm'
import { CategoryManager } from './CategoryManager'
import {
  useArchiveAssetMutation,
  useAssetCategoriesQuery,
  useAssetListQuery,
  useAssignAssetMutation,
  useBulkArchiveMutation,
  useBulkAssignMutation,
  useBulkUpdateCategoryMutation,
  useCreateAssetCategoryMutation,
  useDeleteAssetCategoryMutation,
  useUpdateAssetCategoryMutation,
  useCreateAssetMutation,
  useReturnAssetMutation,
  useUpdateAssetMutation,
} from './hooks'
import { bulkCategorySchema, type AssetFormValues, type AssignAssetValues, type BulkCategoryValues, type CategoryFormValues } from './schemas'
import {
  ASSET_PAGE_SIZE,
  assetSortOptions,
  assetStatusOptions,
  assigneeLabel,
  bulkResultMessage,
  categoryLabel,
  filterAssets,
  formatPurchaseCost,
  formatPurchaseDate,
  summarizeAssets,
} from './structure'
import type { Asset, AssetStatus, AssetWrite } from './types'

const helper = createDataTableHelper<Asset>()

type Drawer = 'create' | 'edit' | 'categories' | 'assign' | 'return' | 'view' | 'bulkEdit' | 'bulkAssign' | null

export default function AssetsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canRead = hasPermission('asset:read')
  const canWrite = hasPermission('asset:write')
  const canView = canRead || canWrite

  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('name,asc')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<AssetStatus | null>(null)
  const [archived, setArchived] = useState(false)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [selected, setSelected] = useState<Asset | null>(null)
  const [pendingArchive, setPendingArchive] = useState<Asset[]>([])

  const assets = useAssetListQuery({ page, size: ASSET_PAGE_SIZE, sort, archived }, canView)
  const categories = useAssetCategoriesQuery(canView)
  const createAsset = useCreateAssetMutation()
  const updateAsset = useUpdateAssetMutation()
  const createCategory = useCreateAssetCategoryMutation()
  const updateCategory = useUpdateAssetCategoryMutation()
  const deleteCategory = useDeleteAssetCategoryMutation()
  const assignAsset = useAssignAssetMutation()
  const returnAsset = useReturnAssetMutation()
  const archiveAsset = useArchiveAssetMutation()
  const bulkCategory = useBulkUpdateCategoryMutation()
  const bulkAssign = useBulkAssignMutation()
  const bulkArchive = useBulkArchiveMutation()

  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    [categories.data],
  )
  const filtersActive = search !== '' || categoryId !== null || status !== null || sort !== 'name,asc' || archived
  const pageRows = assets.data?.data
  const visibleRows = useMemo(
    () => filterAssets(pageRows ?? [], { search, categoryId, status }),
    [pageRows, search, categoryId, status],
  )
  const selection = useRowSelection(canWrite && !archived ? visibleRows : [])
  const totalElements = assets.data?.meta.totalElements ?? 0
  const totalPages = assets.data?.meta.totalPages ?? 0
  const summary = summarizeAssets(pageRows ?? [], totalElements, totalPages <= 1)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: 'Asset',
          cell: ({ row }) => (
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {row.original.name}
              </Text>
              <Text size="xs" c="dimmed">
                {row.original.assetTag}
              </Text>
            </Stack>
          ),
        }),
        helper.display({
          id: 'category',
          header: 'Category',
          cell: ({ row }) => categoryLabel(row.original.categoryId, categoryNames),
        }),
        helper.accessor('serialNumber', {
          header: 'Serial number',
          cell: ({ getValue }) => getValue() || '—',
        }),
        helper.accessor('status', {
          header: 'Status',
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        helper.display({
          id: 'assignee',
          header: 'Assigned to',
          cell: ({ row }) => (
            <Text size="sm" c={row.original.currentAssignment ? undefined : 'dimmed'}>
              {assigneeLabel(row.original)}
            </Text>
          ),
        }),
        helper.accessor('purchaseDate', {
          header: 'Purchase date',
          cell: ({ getValue }) => formatPurchaseDate(getValue()),
        }),
        helper.accessor('purchaseCost', {
          header: 'Purchase cost',
          cell: ({ getValue }) => formatPurchaseCost(getValue()),
        }),
        helper.display({
          id: 'actions',
          header: '',
          cell: ({ row }) => (
            <Group gap={4} justify="flex-end" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
              <Tooltip label="History">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`History for ${row.original.name}`}
                  onClick={() => navigate(`/assets-history?asset=${row.original.id}`)}
                >
                  <History size={16} />
                </ActionIcon>
              </Tooltip>
              {canWrite && !archived ? (
                <Tooltip label="Edit">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`Edit ${row.original.name}`}
                    onClick={() => open('edit', row.original)}
                  >
                    <Pencil size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
              {canWrite && !archived && row.original.status === 'AVAILABLE' ? (
                <Tooltip label="Assign">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`Assign ${row.original.name}`}
                    onClick={() => open('assign', row.original)}
                  >
                    <UserPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
              {canWrite && !archived && row.original.status === 'ASSIGNED' ? (
                <Tooltip label="Return">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`Return ${row.original.name}`}
                    onClick={() => open('return', row.original)}
                  >
                    <Undo2 size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
              {canWrite && !archived && row.original.status === 'AVAILABLE' ? (
                <Tooltip label="Archive">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={`Archive ${row.original.name}`}
                    onClick={() => setPendingArchive([row.original])}
                  >
                    <Archive size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
            </Group>
          ),
        }),
      ]),
    [archived, canWrite, categoryNames, navigate],
  )

  function open(next: Drawer, asset: Asset) {
    setSelected(asset)
    setDrawer(next)
  }

  function close() {
    setDrawer(null)
    setSelected(null)
  }

  async function saveAsset(values: AssetFormValues) {
    const payload = toWrite(values)
    try {
      if (drawer === 'edit' && selected) {
        await updateAsset.mutateAsync({ id: selected.id, payload })
        notifications.show({ color: 'green', message: 'Asset updated' })
      } else {
        await createAsset.mutateAsync(payload)
        notifications.show({ color: 'green', message: 'Asset added' })
      }
      close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function saveCategory(values: CategoryFormValues, categoryToEdit: string | null) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
    }
    try {
      if (categoryToEdit) {
        await updateCategory.mutateAsync({ id: categoryToEdit, payload })
        notifications.show({ color: 'green', message: 'Category updated' })
      } else {
        await createCategory.mutateAsync(payload)
        notifications.show({ color: 'green', message: 'Category added' })
      }
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
      throw error
    }
  }

  async function removeCategory(category: { id: string; name: string }) {
    try {
      await deleteCategory.mutateAsync(category.id)
      if (categoryId === category.id) setCategoryId(null)
      notifications.show({ color: 'green', message: 'Category deleted' })
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
      throw error
    }
  }

  async function saveAssignment(values: AssignAssetValues) {
    if (!selected || selected.status !== 'AVAILABLE') return
    try {
      await assignAsset.mutateAsync({
        id: selected.id,
        payload: { employeeId: values.employeeId, notes: values.notes.trim() || null },
      })
      notifications.show({ color: 'green', message: 'Asset assigned' })
      close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function saveBulkAssignment(values: AssignAssetValues) {
    const rows = selection.selectedRows
    try {
      const result = await bulkAssign.mutateAsync({
        ids: rows.map((row) => row.id),
        payload: { employeeId: values.employeeId, notes: values.notes.trim() || null },
      })
      notifications.show(bulkResultMessage('Assigned', result, namesOf(rows)))
      selection.remove(result.items.filter((item) => item.success).map((item) => item.id))
      if (result.failed === 0) close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function saveBulkCategory(categoryIdValue: string | null) {
    const rows = selection.selectedRows
    try {
      const result = await bulkCategory.mutateAsync({ ids: rows.map((row) => row.id), categoryId: categoryIdValue })
      notifications.show(bulkResultMessage('Updated', result, namesOf(rows)))
      if (result.failed === 0) close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function confirmReturn() {
    if (!selected || selected.status !== 'ASSIGNED' || returnAsset.isPending) return
    try {
      await returnAsset.mutateAsync(selected.id)
      notifications.show({ color: 'green', message: 'Asset returned' })
      close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function confirmArchive() {
    if (pendingArchive.length === 0) return
    const rows = pendingArchive
    try {
      if (rows.length === 1) {
        await archiveAsset.mutateAsync(rows[0].id)
        notifications.show({ color: 'green', message: 'Archived 1 asset' })
        selection.remove([rows[0].id])
      } else {
        const result = await bulkArchive.mutateAsync(rows.map((row) => row.id))
        notifications.show(bulkResultMessage('Archived', result, namesOf(rows)))
        selection.remove(result.items.filter((item) => item.success).map((item) => item.id))
      }
      setPendingArchive([])
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Assets" description="Company equipment, inventory, and employee assignments." />
        <Text size="sm" c="dimmed">
          You do not have permission to view assets.
        </Text>
      </>
    )
  }

  const filteredEmpty = (pageRows?.length ?? 0) > 0 && visibleRows.length === 0
  const archiveBusy = archiveAsset.isPending || bulkArchive.isPending

  return (
    <>
      <PageHeader
        title="Assets"
        description="Company equipment, inventory, and employee assignments."
        actions={
          canWrite ? (
            <Group gap="sm">
              <Button variant="default" leftSection={<Tags size={16} />} onClick={() => setDrawer('categories')}>
                Categories
              </Button>
              <Button leftSection={<Plus size={16} />} onClick={() => setDrawer('create')}>
                Add asset
              </Button>
            </Group>
          ) : (
            <Button variant="default" leftSection={<Tags size={16} />} onClick={() => setDrawer('categories')}>
              Categories
            </Button>
          )
        }
      />
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm" mb="md">
        <SummaryCard icon={Package} color="pink" label="Total assets" value={totalElements.toLocaleString()} />
        <SummaryCard
          icon={PackageCheck}
          color="green"
          label="Available"
          value={summary.available.toLocaleString()}
        />
        <SummaryCard icon={UserCheck} color="blue" label="Assigned" value={summary.assigned.toLocaleString()} />
        <SummaryCard
          icon={Banknote}
          color="violet"
          label="Purchase value"
          value={formatPurchaseCost(summary.purchaseValue)}
        />
      </SimpleGrid>
      <TableToolbar
        filtersActive={filtersActive}
        filters={
          <>
            <TextInput
              placeholder="Search name, tag, or serial"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            <Select
              aria-label="Inventory"
              data={[
                { value: 'active', label: 'Active inventory' },
                { value: 'archived', label: 'Archived' },
              ]}
              value={archived ? 'archived' : 'active'}
              allowDeselect={false}
              onChange={(value) => {
                setArchived(value === 'archived')
                setPage(0)
                selection.clear()
              }}
            />
            <Select
              placeholder="Category"
              clearable
              searchable
              data={(categories.data ?? []).map((category) => ({ value: category.id, label: category.name }))}
              value={categoryId}
              onChange={setCategoryId}
            />
            <Select
              placeholder="Status"
              clearable
              data={assetStatusOptions}
              value={status}
              onChange={(value) => setStatus(value === 'ASSIGNED' || value === 'AVAILABLE' ? value : null)}
            />
            <Select
              aria-label="Sort"
              data={assetSortOptions}
              value={sort}
              allowDeselect={false}
              onChange={(value) => {
                if (!value) return
                setSort(value)
                setPage(0)
              }}
            />
          </>
        }
        actions={
          <>
            <TableFilterActions
              dirty={filtersActive}
              refreshing={assets.isFetching}
              onRefresh={() => void assets.refetch()}
              onClear={() => {
                setSearch('')
                setCategoryId(null)
                setStatus(null)
                setSort('name,asc')
                setArchived(false)
                setPage(0)
                selection.clear()
              }}
            />
            {canWrite && !archived ? (
              <TableBulkActions
                count={selection.selectedIds.length}
                singular="asset"
                plural="assets"
                removeVerb="Archive"
                onEdit={() => setDrawer('bulkEdit')}
                onAssign={() => setDrawer('bulkAssign')}
                onDelete={() => setPendingArchive(selection.selectedRows)}
              />
            ) : null}
          </>
        }
      />
      <Text size="xs" c="dimmed" mb="sm">
        Search, category, and status apply to this page. The asset API does not filter the full inventory.
      </Text>
      <QueryState
        isLoading={assets.isLoading}
        isError={assets.isError}
        error={assets.error}
        onRetry={() => void assets.refetch()}
        isEmpty={!assets.isLoading && !assets.isError && totalElements === 0}
        emptyTitle={archived ? 'No archived assets' : 'No assets yet'}
        emptyDescription={
          archived
            ? 'Assets stay here after they leave the active inventory, including their assignment history.'
            : 'Add equipment for this organization, or create a category first.'
        }
      >
        <DataTable
          data={visibleRows}
          columns={columns}
          page={assets.data?.meta.page ?? page}
          pageSize={ASSET_PAGE_SIZE}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          emptyTitle={filteredEmpty ? 'No matching assets on this page' : 'No assets on this page'}
          emptyDescription={
            filteredEmpty
              ? 'Clear the filters or open another page. Search does not cover the whole inventory.'
              : 'This page has no assets.'
          }
          getRowId={(row) => row.id}
          onRowClick={(row) => open('view', row)}
          selection={
            canWrite && !archived
              ? {
                  selectedIds: selection.selectedIds,
                  onSelectedIdsChange: selection.onSelectedIdsChange,
                  getRowLabel: (row) => row.name,
                }
              : undefined
          }
          sorting={{
            value: sort,
            columns: ['name', 'serialNumber', 'status', 'purchaseDate', 'purchaseCost'],
            onChange: (next) => {
              setSort(next)
              setPage(0)
            },
          }}
        />
      </QueryState>

      <AppDrawer opened={drawer === 'create'} onClose={close} title="Add asset">
        {drawer === 'create' ? (
          <AssetForm categories={categories.data ?? []} submitLabel="Add asset" onCancel={close} onSubmit={saveAsset} />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'edit' && selected != null} onClose={close} title="Edit asset">
        {drawer === 'edit' && selected ? (
          <AssetForm
            key={selected.id}
            categories={categories.data ?? []}
            initial={toForm(selected)}
            submitLabel="Save changes"
            onCancel={close}
            onSubmit={saveAsset}
          />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'categories'} onClose={close} title="Categories">
        {drawer === 'categories' ? (
          <CategoryManager
            categories={categories.data ?? []}
            canWrite={canWrite}
            onClose={close}
            onSave={saveCategory}
            onDelete={removeCategory}
          />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'assign' && selected != null} onClose={close} title="Assign asset">
        {drawer === 'assign' && selected?.status === 'AVAILABLE' ? (
          <AssignAssetForm assetName={selected.name} onCancel={close} onSubmit={saveAssignment} />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'bulkAssign'} onClose={close} title="Assign assets">
        {drawer === 'bulkAssign' ? (
          <AssignAssetForm
            assetName={`${selection.selectedIds.length} selected ${selection.selectedIds.length === 1 ? 'asset' : 'assets'}`}
            submitLabel="Assign selected"
            onCancel={close}
            onSubmit={saveBulkAssignment}
          />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'bulkEdit'} onClose={close} title="Edit category">
        {drawer === 'bulkEdit' ? (
          <BulkCategoryForm
            count={selection.selectedIds.length}
            categories={categories.data ?? []}
            onCancel={close}
            onSubmit={saveBulkCategory}
          />
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'return' && selected != null} onClose={close} title="Return asset">
        {selected && drawer === 'return' ? (
          <Stack>
            <Text size="sm">
              Return {selected.name} ({selected.assetTag})? It is currently held by {assigneeLabel(selected)}. The asset
              becomes available again, and this assignment stays in the history.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" disabled={returnAsset.isPending} onClick={close}>
                Cancel
              </Button>
              <Button loading={returnAsset.isPending} onClick={() => void confirmReturn()}>
                Return asset
              </Button>
            </Group>
          </Stack>
        ) : null}
      </AppDrawer>
      <AppDrawer opened={pendingArchive.length > 0} onClose={() => setPendingArchive([])} title="Archive assets">
        {pendingArchive.length > 0 ? (
          <Stack>
            <Text size="sm">
              Archive {pendingArchive.length === 1 ? pendingArchive[0].name : `${pendingArchive.length} assets`}? Archived
              assets leave the active inventory. The record stays in Asset history. Assets that
              are still assigned are left in place.
            </Text>
            <Stack gap={2}>
              {pendingArchive.slice(0, 8).map((asset) => (
                <Text key={asset.id} size="sm">
                  {asset.name} · {asset.assetTag}
                </Text>
              ))}
              {pendingArchive.length > 8 ? (
                <Text size="xs" c="dimmed">
                  and {pendingArchive.length - 8} more
                </Text>
              ) : null}
            </Stack>
            <Group justify="flex-end">
              <Button variant="default" disabled={archiveBusy} onClick={() => setPendingArchive([])}>
                Cancel
              </Button>
              <Button color="red" loading={archiveBusy} onClick={() => void confirmArchive()}>
                Archive
              </Button>
            </Group>
          </Stack>
        ) : null}
      </AppDrawer>
      <AppDrawer opened={drawer === 'view' && selected != null} onClose={close} title={selected?.name ?? 'Asset'}>
        {selected && drawer === 'view' ? (
          <Stack gap="lg">
            <Group justify="space-between" align="center" wrap="nowrap">
              <DetailField label="Asset tag" value={selected.assetTag} />
              <StatusBadge status={selected.status} />
            </Group>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" fw={600}>
                Current assignment
              </Text>
              {selected.currentAssignment ? (
                <>
                  <Text size="sm" fw={600} mt={6}>
                    {selected.currentAssignment.fullName}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {selected.currentAssignment.employeeNumber} · Since {formatDateTime(selected.currentAssignment.assignedAt)}
                  </Text>
                </>
              ) : (
                <>
                  <Text size="sm" fw={600} mt={6}>
                    {assigneeLabel(selected)}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {selected.status === 'ASSIGNED'
                      ? 'The holder is not included on this record.'
                      : 'Available to assign.'}
                  </Text>
                </>
              )}
            </Paper>
            <SimpleGrid cols={2} spacing="md" verticalSpacing="md">
              <DetailField label="Category" value={categoryLabel(selected.categoryId, categoryNames)} />
              <DetailField label="Serial number" value={selected.serialNumber || '—'} />
              <DetailField label="Purchase date" value={formatPurchaseDate(selected.purchaseDate)} />
              <DetailField label="Purchase cost" value={formatPurchaseCost(selected.purchaseCost)} />
            </SimpleGrid>
            <DetailField label="Notes" value={selected.notes || 'No notes recorded.'} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate(`/assets-history?asset=${selected.id}`)}>
                History
              </Button>
              {canWrite && !archived && selected.status === 'AVAILABLE' ? (
                <Button variant="default" onClick={() => setDrawer('assign')}>
                  Assign
                </Button>
              ) : null}
              {canWrite && !archived && selected.status === 'ASSIGNED' ? (
                <Button variant="default" onClick={() => setDrawer('return')}>
                  Return
                </Button>
              ) : null}
              {canWrite && !archived ? (
                <Button onClick={() => setDrawer('edit')}>Edit</Button>
              ) : null}
            </Group>
          </Stack>
        ) : null}
      </AppDrawer>
    </>
  )
}

function BulkCategoryForm({
  count,
  categories,
  onSubmit,
  onCancel,
}: {
  count: number
  categories: Array<{ id: string; name: string }>
  onSubmit: (categoryId: string | null) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: { categoryId: '', clearCategory: false } as BulkCategoryValues,
    validators: { onSubmit: bulkCategorySchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value.clearCategory ? null : value.categoryId)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <Stack gap="sm">
        <Text size="sm">
          Change the category for {count} selected {count === 1 ? 'asset' : 'assets'}. Names, tags, costs, and assignments
          stay as they are.
        </Text>
        <form.Subscribe selector={(state) => state.values.clearCategory}>
          {(clearCategory) => (
            <form.Field name="categoryId">
              {(field) => (
                <Select
                  label="Category"
                  placeholder="Choose a category"
                  clearable
                  searchable
                  disabled={clearCategory}
                  data={categories.map((category) => ({ value: category.id, label: category.name }))}
                  value={field.state.value || null}
                  onChange={(value) => field.handleChange(value ?? '')}
                  error={fieldError(field.state.meta.errors)}
                />
              )}
            </form.Field>
          )}
        </form.Subscribe>
        <form.Field name="clearCategory">
          {(field) => (
            <Checkbox
              label="Remove the category"
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.currentTarget.checked)}
            />
          )}
        </form.Field>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting}>
                Update category
              </Button>
            )}
          </form.Subscribe>
        </Group>
      </Stack>
    </form>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </Stack>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  color: string
}) {
  return (
    <Paper withBorder px="sm" py="xs" radius="md">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size={28} radius="md">
          <Icon size={15} strokeWidth={1.75} />
        </ThemeIcon>
        <Text size="sm" truncate>
          {label}
        </Text>
      </Group>
      <Text fw={600} fz="lg" lh={1.2} mt={6}>
        {value}
      </Text>
    </Paper>
  )
}

function toWrite(values: AssetFormValues): AssetWrite {
  return {
    name: values.name.trim(),
    assetTag: values.assetTag.trim(),
    categoryId: values.categoryId || null,
    serialNumber: values.serialNumber.trim() || null,
    purchaseDate: values.purchaseDate || null,
    purchaseCost: values.purchaseCost.trim() ? Number(values.purchaseCost) : null,
    notes: values.notes.trim() || null,
  }
}

function toForm(asset: Asset): AssetFormValues {
  return {
    name: asset.name,
    assetTag: asset.assetTag,
    categoryId: asset.categoryId ?? '',
    serialNumber: asset.serialNumber ?? '',
    purchaseDate: asset.purchaseDate?.slice(0, 10) ?? '',
    purchaseCost: asset.purchaseCost == null ? '' : asset.purchaseCost.toFixed(2),
    notes: asset.notes ?? '',
  }
}

function namesOf(rows: Asset[]) {
  return new Map(rows.map((row) => [row.id, row.name]))
}
