import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Plus, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { AppDrawer } from '../../components/ui/AppDrawer'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { TableBulkActions } from '../../components/ui/TableBulkActions'
import { TableFilterActions } from '../../components/ui/TableFilterActions'
import { TableToolbar } from '../../components/ui/TableToolbar'
import { TableRowActions } from '../../components/ui/TableRowActions'
import { useDrawerList } from '../../components/ui/useDrawerList'
import { useRowSelection } from '../../components/ui/useRowSelection'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { OrgUnitStatus, Position } from '../../types/organization'
import { errorMessage, formatDateTime } from '../../utils/format'
import {
  useBulkDeletePositionsMutation,
  useBulkUpdatePositionsMutation,
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
  bulkOutcomeNotice,
  orgUnitStatusOptions,
  parseOrgUnitStatus,
  positionBulkPatch,
  positionSortOptions,
  positionWriteFromBulk,
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
  const [bulkEdit, setBulkEdit] = useState(false)
  const [bulkErrors, setBulkErrors] = useState<string[]>([])
  const {
    opened: deleteOpened,
    items: pendingDelete,
    errors: deleteErrors,
    setErrors: setDeleteErrors,
    setItems: setPendingDelete,
    setVisible: setDeleteVisible,
    ask: askDelete,
    onExitTransitionEnd: clearDeleteAfterClose,
  } = useDrawerList<Position>()

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
  const bulkDelete = useBulkDeletePositionsMutation()
  const bulkUpdate = useBulkUpdatePositionsMutation()
  const busy = bulkDelete.isPending || bulkUpdate.isPending
  const rows = query.data?.data
  const selection = useRowSelection(rows)

  const open = useCallback((next: EditorMode, position: Position | null) => {
    setSelected(position)
    setMode(next)
  }, [])

  const close = useCallback(() => {
    setMode(null)
    setSelected(null)
  }, [])

  const { mutate: changePositionStatus } = statusMutation
  const changeStatus = useCallback(
    (position: Position, next: OrgUnitStatus) => {
      changePositionStatus(
        { id: position.id, status: next },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: next === 'ACTIVE' ? 'Position reactivated' : 'Position deactivated',
            })
          },
        },
      )
    },
    [changePositionStatus],
  )

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
    [askDelete, canDelete, canUpdate, changeStatus, open],
  )

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

  async function confirmDelete() {
    if (pendingDelete.length === 0 || busy) return
    setDeleteErrors([])
    try {
      const result = await bulkDelete.mutateAsync(
        pendingDelete.map((position) => ({ id: position.id, label: position.title })),
      )
      if (result.succeededIds.length > 0) selection.remove(result.succeededIds)
      const succeeded = new Set(result.succeededIds)
      const remaining = pendingDelete.filter((position) => !succeeded.has(position.id))
      setDeleteErrors(result.failures)
      if (remaining.length === 0) setDeleteVisible(false)
      else setPendingDelete(remaining)
      notifications.show(bulkOutcomeNotice('deleted', 'Position', 'positions', result))
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function applyBulkEdit(values: PositionBulkValues) {
    const patch = positionBulkPatch(values)
    const targets = selection.selectedRows
    if (!patch || targets.length === 0 || busy) return
    try {
      const result = await bulkUpdate.mutateAsync(
        targets.map((position) => ({
          id: position.id,
          label: position.title,
          payload: positionWriteFromBulk(position, patch),
        })),
      )
      if (result.succeededIds.length > 0) selection.remove(result.succeededIds)
      setBulkErrors(result.failures)
      if (result.failures.length === 0) setBulkEdit(false)
      notifications.show(bulkOutcomeNotice('updated', 'Position', 'positions', result))
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
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
              data={orgUnitStatusOptions}
              value={status}
              onChange={(value) => {
                setStatus(parseOrgUnitStatus(value))
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
        opened={deleteOpened}
        onClose={() => {
          if (!busy) setDeleteVisible(false)
        }}
        onExitTransitionEnd={clearDeleteAfterClose}
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
