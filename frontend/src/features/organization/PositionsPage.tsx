import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { AppDrawer } from '../../components/ui/AppDrawer'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { TableBulkActions } from '../../components/ui/TableBulkActions'
import { TableFilterActions } from '../../components/ui/TableFilterActions'
import { TableToolbar } from '../../components/ui/TableToolbar'
import { TableRowActions } from '../../components/ui/TableRowActions'
import { useRowSelection } from '../../components/ui/useRowSelection'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { OrgUnitStatus, Position } from '../../types/organization'
import { errorMessage, formatDateTime } from '../../utils/format'
import { deletePosition, updatePosition } from './api'
import {
  useCreatePositionMutation,
  useDepartmentsQuery,
  usePositionListQuery,
  usePositionStatusMutation,
  useUpdatePositionMutation,
} from './hooks'
import { PositionBulkForm } from './PositionBulkForm'
import { PositionForm } from './PositionForm'
import type { PositionBulkValues, PositionFormValues } from './schemas'
import {
  activeDepartmentOptions,
  bulkDeleteConfirmation,
  positionBulkPatch,
  positionSortOptions,
  positionWriteFromBulk,
  settleBulk,
} from './structure'

const helper = createDataTableHelper<Position>()

type EditorMode = 'create' | 'edit' | 'view' | null

export default function PositionsPage() {
  const { user, hasPermission } = useAuth()
  const organizationId = user?.organizationId ?? null
  const canCreate = hasPermission('position:create')
  const canUpdate = hasPermission('position:update')
  const canDelete = hasPermission('position:delete')

  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('title,asc')
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrgUnitStatus | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [mode, setMode] = useState<EditorMode>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Position[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteOpenRef = useRef(false)
  const [deleteErrors, setDeleteErrors] = useState<string[]>([])
  const [bulkEdit, setBulkEdit] = useState(false)
  const [bulkErrors, setBulkErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const departments = useDepartmentsQuery({ activeOnly: true })
  const departmentOptions = useMemo(
    () => activeDepartmentOptions(departments.data?.data ?? [], organizationId),
    [departments.data, organizationId],
  )

  const query = usePositionListQuery({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    status: status ?? undefined,
    departmentId: departmentId || undefined,
    sort,
  })

  const createMutation = useCreatePositionMutation()
  const updateMutation = useUpdatePositionMutation()
  const statusMutation = usePositionStatusMutation()
  const rows = query.data?.data
  const selection = useRowSelection(rows)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('title', { header: 'Title' }),
        helper.accessor((row) => row.departmentName ?? '—', { id: 'department', header: 'Department' }),
        helper.accessor((row) => row.level ?? '—', { id: 'level', header: 'Level' }),
        helper.accessor('employeeCount', { header: 'Employees' }),
        helper.accessor('status', {
          header: 'Status',
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        helper.display({
          id: 'actions',
          header: '',
          cell: ({ row }) => (
            <TableRowActions
              onView={() => open('view', row.original)}
              onEdit={canUpdate ? () => open('edit', row.original) : undefined}
              onToggleActive={
                canUpdate
                  ? () => void changeStatus(row.original, row.original.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                  : undefined
              }
              active={row.original.status === 'ACTIVE'}
              onDelete={canDelete ? () => askDelete([row.original]) : undefined}
            />
          ),
        }),
      ]),
    [canDelete, canUpdate],
  )

  function open(next: EditorMode, position: Position | null) {
    setSelected(position)
    setMode(next)
  }

  function close() {
    setMode(null)
    setSelected(null)
  }

  async function save(values: PositionFormValues) {
    const payload = {
      title: values.title.trim(),
      departmentId: values.departmentId,
      level: values.level.trim() || null,
      description: values.description.trim() || null,
      status: values.status,
    }
    try {
      if (mode === 'edit' && selected) {
        await updateMutation.mutateAsync({ id: selected.id, payload })
        notifications.show({ color: 'green', message: 'Position updated' })
      } else {
        await createMutation.mutateAsync(payload)
        notifications.show({ color: 'green', message: 'Position created' })
      }
      close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function changeStatus(position: Position, next: OrgUnitStatus) {
    await statusMutation.mutateAsync({ id: position.id, status: next })
    notifications.show({
      color: 'green',
      message: next === 'ACTIVE' ? 'Position reactivated' : 'Position deactivated',
    })
  }

  function setDeleteVisible(open: boolean) {
    deleteOpenRef.current = open
    setDeleteOpen(open)
  }

  function askDelete(items: Position[]) {
    setDeleteErrors([])
    setPendingDelete(items)
    setDeleteVisible(true)
  }

  async function confirmDelete() {
    if (pendingDelete.length === 0 || busy) return
    setBusy(true)
    setDeleteErrors([])
    try {
      const result = await settleBulk(
        pendingDelete.map((position) => ({
          id: position.id,
          label: position.title,
          run: () => deletePosition(position.id, organizationId ?? undefined),
        })),
        errorMessage,
      )
      if (result.succeededIds.length > 0) {
        await queryClient.invalidateQueries({ queryKey: ['departments'] })
        await queryClient.invalidateQueries({ queryKey: ['positions'] })
        selection.remove(result.succeededIds)
      }
      const succeeded = new Set(result.succeededIds)
      const remaining = pendingDelete.filter((position) => !succeeded.has(position.id))
      setDeleteErrors(result.failures)
      if (remaining.length === 0) setDeleteVisible(false)
      else setPendingDelete(remaining)
      if (result.failures.length === 0) {
        notifications.show({
          color: 'green',
          message:
            result.succeededIds.length === 1 ? 'Position deleted' : `${result.succeededIds.length} positions deleted`,
        })
      } else {
        notifications.show({
          color: result.succeededIds.length === 0 ? 'red' : 'yellow',
          message:
            result.succeededIds.length === 0
              ? (result.failures[0] ?? 'Delete failed')
              : `Deleted ${result.succeededIds.length}. ${result.failures.length} could not be deleted.`,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function applyBulkEdit(values: PositionBulkValues) {
    const patch = positionBulkPatch(values)
    const targets = selection.selectedRows
    if (!patch || targets.length === 0) return
    setBusy(true)
    try {
    const result = await settleBulk(
      targets.map((position) => ({
        id: position.id,
        label: position.title,
        run: () =>
          updatePosition(position.id, positionWriteFromBulk(position, patch), organizationId ?? undefined).then(
            () => undefined,
          ),
      })),
      errorMessage,
    )
    if (result.succeededIds.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ['departments'] })
      await queryClient.invalidateQueries({ queryKey: ['positions'] })
      selection.remove(result.succeededIds)
    }
    setBulkErrors(result.failures)
    if (result.failures.length === 0) {
      setBulkEdit(false)
      notifications.show({
        color: 'green',
        message:
          result.succeededIds.length === 1 ? 'Position updated' : `${result.succeededIds.length} positions updated`,
      })
    } else {
      notifications.show({
        color: result.succeededIds.length === 0 ? 'red' : 'yellow',
        message:
          result.succeededIds.length === 0
            ? (result.failures[0] ?? 'Update failed')
            : `Updated ${result.succeededIds.length}. ${result.failures.length} could not be updated.`,
      })
    }
    } finally {
      setBusy(false)
    }
  }

  const confirmation = bulkDeleteConfirmation(
    'position',
    pendingDelete.map((position) => position.title),
  )
  const tableRows = rows ?? []
  const canSelect = canUpdate || canDelete

  return (
    <>
      <PageHeader
        title="Positions"
        description="Positions in the current organization"
        actions={
          canCreate ? (
            <Button leftSection={<Plus size={16} />} onClick={() => open('create', null)}>
              Create position
            </Button>
          ) : null
        }
      />
      <TableToolbar
        filtersActive={search !== '' || status !== null || departmentId !== null || sort !== 'title,asc'}
        filters={
          <>
            <TextInput
              placeholder="Search title or level"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value)
                setPage(0)
              }}
            />
            <Select
              placeholder="Department"
              clearable
              searchable
              data={departmentOptions}
              value={departmentId}
              onChange={(value) => {
                setDepartmentId(value)
                setPage(0)
              }}
            />
            <Select
              placeholder="Status"
              clearable
              data={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              value={status}
              onChange={(value) => {
                setStatus(value === 'INACTIVE' ? 'INACTIVE' : value === 'ACTIVE' ? 'ACTIVE' : null)
                setPage(0)
              }}
            />
            <Select
              aria-label="Sort"
              data={positionSortOptions}
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
              dirty={search !== '' || status !== null || departmentId !== null || sort !== 'title,asc'}
              refreshing={query.isFetching}
              onRefresh={() => void query.refetch()}
              onClear={() => {
                setSearch('')
                setStatus(null)
                setDepartmentId(null)
                setSort('title,asc')
                setPage(0)
              }}
            />
            {canSelect ? (
              <TableBulkActions
                count={selection.selectedIds.length}
                singular="position"
                plural="positions"
                onEdit={
                  canUpdate
                    ? () => {
                        setBulkErrors([])
                        setBulkEdit(true)
                      }
                    : undefined
                }
                onDelete={canDelete ? () => askDelete(selection.selectedRows) : undefined}
              />
            ) : null}
          </>
        }
      />
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.isError && tableRows.length === 0}
        emptyTitle="No positions yet"
        emptyDescription="Create a position in one of this organization's departments, or adjust the filters."
      >
        <DataTable
          data={tableRows}
          columns={columns}
          page={query.data?.meta.page ?? page}
          pageSize={query.data?.meta.size ?? pageSize}
          totalPages={query.data?.meta.totalPages ?? 0}
          totalElements={query.data?.meta.totalElements ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(0)
          }}
          getRowId={(row) => row.id}
          onRowClick={(row) => open('view', row)}
          sorting={{
            value: sort,
            columns: ['title', 'level', 'status'],
            onChange: (next) => {
              setSort(next)
              setPage(0)
            },
          }}
          selection={
            canSelect
              ? {
                  selectedIds: selection.selectedIds,
                  onSelectedIdsChange: selection.onSelectedIdsChange,
                  getRowLabel: (row) => row.title,
                }
              : undefined
          }
        />
      </QueryState>

      <AppDrawer
        opened={mode === 'create' || mode === 'edit'}
        onClose={close}
        title={mode === 'edit' ? 'Edit position' : 'Create position'}
      >
        {mode === 'create' || mode === 'edit' ? (
          <PositionForm
            key={`${mode}-${selected?.id ?? 'new'}-${organizationId ?? ''}`}
            position={mode === 'edit' ? selected : null}
            submitLabel={mode === 'edit' ? 'Save changes' : 'Create position'}
            onCancel={close}
            onSubmit={save}
          />
        ) : null}
      </AppDrawer>

      <AppDrawer opened={mode === 'view' && selected != null} onClose={close} title={selected?.title ?? 'Position'}>
        {selected ? (
          <Stack gap="xs">
            <Text size="sm">Department: {selected.departmentName ?? '—'}</Text>
            <Text size="sm">Level: {selected.level ?? '—'}</Text>
            <Text size="sm">Employees: {selected.employeeCount}</Text>
            <Group gap="xs">
              <Text size="sm">Status:</Text>
              <StatusBadge status={selected.status} />
            </Group>
            <Text size="sm">{selected.description || 'No description'}</Text>
            <Text size="sm" c="dimmed">
              Updated {formatDateTime(selected.updatedAt)}
            </Text>
            {canUpdate ? (
              <Group justify="flex-end">
                <Button variant="default" onClick={() => open('edit', selected)}>
                  Edit
                </Button>
              </Group>
            ) : null}
          </Stack>
        ) : null}
      </AppDrawer>

      <AppDrawer
        opened={bulkEdit}
        onClose={() => {
          if (!busy) setBulkEdit(false)
        }}
        title={`Edit ${selection.selectedRows.length} ${selection.selectedRows.length === 1 ? 'position' : 'positions'}`}
      >
        {bulkErrors.length > 0 ? (
          <Stack gap={4} mb="md">
            {bulkErrors.map((line) => (
              <Text key={line} size="sm" c="red">
                {line}
              </Text>
            ))}
          </Stack>
        ) : null}
        {bulkEdit ? (
          <PositionBulkForm
            count={selection.selectedRows.length}
            onCancel={() => setBulkEdit(false)}
            onSubmit={applyBulkEdit}
          />
        ) : null}
      </AppDrawer>

      <AppDrawer
        opened={deleteOpen}
        onClose={() => {
          if (!busy) setDeleteVisible(false)
        }}
        onExitTransitionEnd={() => {
          if (!deleteOpenRef.current) {
            setPendingDelete([])
            setDeleteErrors([])
          }
        }}
        title={confirmation.title}
      >
        <Stack>
          <Text size="sm">{confirmation.body}</Text>
          {deleteErrors.map((line) => (
            <Text key={line} size="sm" c="red">
              {line}
            </Text>
          ))}
          <Group justify="flex-end">
            <Button variant="default" disabled={busy} onClick={() => setDeleteVisible(false)}>
              Cancel
            </Button>
            <Button color="red" loading={busy} onClick={() => void confirmDelete()}>
              {pendingDelete.length === 1 ? 'Delete position' : `Delete ${pendingDelete.length} positions`}
            </Button>
          </Group>
        </Stack>
      </AppDrawer>
    </>
  )
}
