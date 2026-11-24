import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { AppDrawer } from '../../components/ui/AppDrawer'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { TableRowActions } from '../../components/ui/TableRowActions'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { Department, OrgUnitStatus } from '../../types/organization'
import { errorMessage, formatDateTime } from '../../utils/format'
import { DepartmentForm } from './DepartmentForm'
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useDepartmentListQuery,
  useDepartmentStatusMutation,
  useUpdateDepartmentMutation,
} from './hooks'
import type { DepartmentFormValues } from './schemas'
import { deleteConfirmation } from './structure'

const helper = createDataTableHelper<Department>()

type EditorMode = 'create' | 'edit' | 'view' | null

export default function DepartmentsPage() {
  const { user, hasPermission } = useAuth()
  const organizationId = user?.organizationId ?? null
  const canCreate = hasPermission('department:create')
  const canUpdate = hasPermission('department:update')
  const canDelete = hasPermission('department:delete')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrgUnitStatus | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [mode, setMode] = useState<EditorMode>(null)
  const [selected, setSelected] = useState<Department | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null)

  const query = useDepartmentListQuery({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    status: status ?? undefined,
    sort: 'name,asc',
  })

  const createMutation = useCreateDepartmentMutation()
  const updateMutation = useUpdateDepartmentMutation()
  const statusMutation = useDepartmentStatusMutation()
  const deleteMutation = useDeleteDepartmentMutation()

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
              onDelete={canDelete ? () => setPendingDelete(row.original) : undefined}
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

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      notifications.show({ color: 'green', message: 'Department deleted' })
      setPendingDelete(null)
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  const confirmation = pendingDelete ? deleteConfirmation('department', pendingDelete.name) : null
  const rows = query.data?.data ?? []

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
      <Group mb="md" align="flex-end">
        <TextInput
          placeholder="Search name or code"
          leftSection={<Search size={16} />}
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            setPage(0)
          }}
          maw={360}
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
          maw={180}
        />
      </Group>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.isError && rows.length === 0}
        emptyTitle="No departments yet"
        emptyDescription={
          organizationId
            ? 'Create a department for this organization, or adjust the filters.'
            : 'Select an organization to manage departments.'
        }
      >
        <DataTable
          data={rows}
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

      <AppDrawer opened={pendingDelete != null} onClose={() => setPendingDelete(null)} title={confirmation?.title}>
        <Stack>
          <Text size="sm">{confirmation?.body}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button color="red" loading={deleteMutation.isPending} onClick={() => void confirmDelete()}>
              Delete department
            </Button>
          </Group>
        </Stack>
      </AppDrawer>
    </>
  )
}
