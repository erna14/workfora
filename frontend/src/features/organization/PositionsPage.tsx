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
import type { OrgUnitStatus, Position } from '../../types/organization'
import { errorMessage, formatDateTime } from '../../utils/format'
import {
  useCreatePositionMutation,
  useDeletePositionMutation,
  useDepartmentsQuery,
  usePositionListQuery,
  usePositionStatusMutation,
  useUpdatePositionMutation,
} from './hooks'
import { PositionForm } from './PositionForm'
import type { PositionFormValues } from './schemas'
import { activeDepartmentOptions, deleteConfirmation } from './structure'

const helper = createDataTableHelper<Position>()

type EditorMode = 'create' | 'edit' | 'view' | null

export default function PositionsPage() {
  const { user, hasPermission } = useAuth()
  const organizationId = user?.organizationId ?? null
  const canCreate = hasPermission('position:create')
  const canUpdate = hasPermission('position:update')
  const canDelete = hasPermission('position:delete')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrgUnitStatus | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [mode, setMode] = useState<EditorMode>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Position | null>(null)

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
    sort: 'title,asc',
  })

  const createMutation = useCreatePositionMutation()
  const updateMutation = useUpdatePositionMutation()
  const statusMutation = usePositionStatusMutation()
  const deleteMutation = useDeletePositionMutation()

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
              onDelete={canDelete ? () => setPendingDelete(row.original) : undefined}
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

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      notifications.show({ color: 'green', message: 'Position deleted' })
      setPendingDelete(null)
    } catch (error) {
      notifications.show({ color: 'red', message: errorMessage(error) })
    }
  }

  const confirmation = pendingDelete ? deleteConfirmation('position', pendingDelete.title) : null
  const rows = query.data?.data ?? []

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
      <Group mb="md" align="flex-end">
        <TextInput
          placeholder="Search title or level"
          leftSection={<Search size={16} />}
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            setPage(0)
          }}
          maw={360}
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
          maw={240}
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
        emptyTitle="No positions yet"
        emptyDescription="Create a position in one of this organization's departments, or adjust the filters."
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

      <AppDrawer opened={pendingDelete != null} onClose={() => setPendingDelete(null)} title={confirmation?.title}>
        <Stack>
          <Text size="sm">{confirmation?.body}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button color="red" loading={deleteMutation.isPending} onClick={() => void confirmDelete()}>
              Delete position
            </Button>
          </Group>
        </Stack>
      </AppDrawer>
    </>
  )
}
