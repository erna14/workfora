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
import type { Department, OrgUnitStatus } from '../../types/organization'
import { errorMessage, formatDateTime } from '../../utils/format'
import { deleteDepartment, updateDepartment } from './api'
import { DepartmentBulkForm } from './DepartmentBulkForm'
import { DepartmentForm } from './DepartmentForm'
import {
  useCreateDepartmentMutation,
  useDepartmentListQuery,
  useDepartmentStatusMutation,
  useUpdateDepartmentMutation,
} from './hooks'
import type { DepartmentBulkValues, DepartmentFormValues } from './schemas'
import {
  bulkDeleteConfirmation,
  departmentBulkPatch,
  departmentSortOptions,
  departmentWriteFromBulk,
  settleBulk,
} from './structure'

const helper = createDataTableHelper<Department>()

type EditorMode = 'create' | 'edit' | 'view' | null

export default function DepartmentsPage() {
  const { user, hasPermission } = useAuth()
  const organizationId = user?.organizationId ?? null
  const canCreate = hasPermission('department:create')
  const canUpdate = hasPermission('department:update')
  const canDelete = hasPermission('department:delete')

  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('name,asc')
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrgUnitStatus | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [mode, setMode] = useState<EditorMode>(null)
  const [selected, setSelected] = useState<Department | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Department[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteOpenRef = useRef(false)
  const [deleteErrors, setDeleteErrors] = useState<string[]>([])
  const [bulkEdit, setBulkEdit] = useState(false)
  const [bulkErrors, setBulkErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const query = useDepartmentListQuery({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    status: status ?? undefined,
    sort,
  })

  const createMutation = useCreateDepartmentMutation()
  const updateMutation = useUpdateDepartmentMutation()
  const statusMutation = useDepartmentStatusMutation()
  const rows = query.data?.data
  const selection = useRowSelection(rows)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', { header: 'Name' }),
        helper.accessor('code', { header: 'Code' }),
        helper.accessor((row) => row.managerName ?? '—', { id: 'head', header: 'Department head' }),
        helper.accessor('employeeCount', { header: 'Employees' }),
        helper.accessor('positionCount', { header: 'Positions' }),
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

  function open(next: EditorMode, department: Department | null) {
    setSelected(department)
    setMode(next)
  }

  function close() {
    setMode(null)
    setSelected(null)
  }

  async function save(values: DepartmentFormValues) {
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description.trim() || null,
      managerEmployeeId: values.managerEmployeeId || null,
      parentId: selected?.parentId ?? null,
      status: values.status,
    }
    try {
      if (mode === 'edit' && selected) {
        await updateMutation.mutateAsync({ id: selected.id, payload })
        notifications.show({ color: 'green', message: 'Department updated' })
      } else {
        await createMutation.mutateAsync(payload)
        notifications.show({ color: 'green', message: 'Department created' })
      }
      close()
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  async function changeStatus(department: Department, next: OrgUnitStatus) {
    await statusMutation.mutateAsync({ id: department.id, status: next })
    notifications.show({
      color: 'green',
      message: next === 'ACTIVE' ? 'Department reactivated' : 'Department deactivated',
    })
  }

  function setDeleteVisible(open: boolean) {
    deleteOpenRef.current = open
    setDeleteOpen(open)
  }

  function askDelete(items: Department[]) {
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
        pendingDelete.map((department) => ({
          id: department.id,
          label: department.name,
          run: () => deleteDepartment(department.id, organizationId ?? undefined),
        })),
        errorMessage,
      )
      if (result.succeededIds.length > 0) {
        await queryClient.invalidateQueries({ queryKey: ['departments'] })
        await queryClient.invalidateQueries({ queryKey: ['positions'] })
        selection.remove(result.succeededIds)
      }
      const succeeded = new Set(result.succeededIds)
      const remaining = pendingDelete.filter((department) => !succeeded.has(department.id))
      setDeleteErrors(result.failures)
      if (remaining.length === 0) setDeleteVisible(false)
      else setPendingDelete(remaining)
      if (result.failures.length === 0) {
        notifications.show({
          color: 'green',
          message:
            result.succeededIds.length === 1
              ? 'Department deleted'
              : `${result.succeededIds.length} departments deleted`,
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

  async function applyBulkEdit(values: DepartmentBulkValues) {
    const patch = departmentBulkPatch(values)
    const targets = selection.selectedRows
    if (!patch || targets.length === 0) return
    setBusy(true)
    try {
    const result = await settleBulk(
      targets.map((department) => ({
        id: department.id,
        label: department.name,
        run: () =>
          updateDepartment(department.id, departmentWriteFromBulk(department, patch), organizationId ?? undefined).then(
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
          result.succeededIds.length === 1
            ? 'Department updated'
            : `${result.succeededIds.length} departments updated`,
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
    'department',
    pendingDelete.map((department) => department.name),
  )
  const tableRows = rows ?? []
  const canSelect = canUpdate || canDelete

  return (
    <>
      <PageHeader
        title="Departments"
        description="Departments in the current organization"
        actions={
          canCreate ? (
            <Button leftSection={<Plus size={16} />} onClick={() => open('create', null)}>
              Create department
            </Button>
          ) : null
        }
      />
      <TableToolbar
        filtersActive={search !== '' || status !== null || sort !== 'name,asc'}
        filters={
          <>
            <TextInput
              placeholder="Search name or code"
              leftSection={<Search size={16} />}
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value)
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
              data={departmentSortOptions}
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
              dirty={search !== '' || status !== null || sort !== 'name,asc'}
              refreshing={query.isFetching}
              onRefresh={() => void query.refetch()}
              onClear={() => {
                setSearch('')
                setStatus(null)
                setSort('name,asc')
                setPage(0)
              }}
            />
            {canSelect ? (
              <TableBulkActions
                count={selection.selectedIds.length}
                singular="department"
                plural="departments"
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
        emptyTitle="No departments yet"
        emptyDescription={
          organizationId
            ? 'Create a department for this organization, or adjust the filters.'
            : 'Select an organization to manage departments.'
        }
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
            columns: ['name', 'code', 'status'],
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
                  getRowLabel: (row) => row.name,
                }
              : undefined
          }
        />
      </QueryState>

      <AppDrawer
        opened={mode === 'create' || mode === 'edit'}
        onClose={close}
        title={mode === 'edit' ? 'Edit department' : 'Create department'}
      >
        <DepartmentForm
          department={mode === 'edit' ? selected : null}
          submitLabel={mode === 'edit' ? 'Save changes' : 'Create department'}
          onCancel={close}
          onSubmit={save}
        />
      </AppDrawer>

      <AppDrawer opened={mode === 'view' && selected != null} onClose={close} title={selected?.name ?? 'Department'}>
        {selected ? (
          <Stack gap="xs">
            <Text size="sm">Code: {selected.code}</Text>
            <Text size="sm">Head: {selected.managerName ?? '—'}</Text>
            <Text size="sm">Employees: {selected.employeeCount}</Text>
            <Text size="sm">Positions: {selected.positionCount}</Text>
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
        title={`Edit ${selection.selectedRows.length} ${selection.selectedRows.length === 1 ? 'department' : 'departments'}`}
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
          <DepartmentBulkForm
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
              {pendingDelete.length === 1 ? 'Delete department' : `Delete ${pendingDelete.length} departments`}
            </Button>
          </Group>
        </Stack>
      </AppDrawer>
    </>
  )
}
