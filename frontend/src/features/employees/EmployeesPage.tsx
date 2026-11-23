import { Button, Group, Select, TextInput } from '@mantine/core'
import { Link, useNavigate } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createDataTableHelper, DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { EMPLOYEE_STATUSES, type EmployeeListItem } from '../../types/employee'
import { fullName, formatDate } from '../../utils/format'
import { useDepartmentsQuery } from '../organization/hooks'
import { useEmployeesQuery } from './hooks'

const helper = createDataTableHelper<EmployeeListItem>()

const columns = helper.columns([
  helper.accessor((row) => fullName(row.firstName, row.lastName), {
    id: 'name',
    header: 'Employee',
    cell: ({ row }) => (
      <Group gap="sm" wrap="nowrap">
        <UserAvatar firstName={row.original.firstName} lastName={row.original.lastName} />
        <div>
          <div style={{ fontWeight: 500 }}>
            {fullName(row.original.firstName, row.original.lastName)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
            {row.original.workEmail}
          </div>
        </div>
      </Group>
    ),
  }),
  helper.accessor('employeeNumber', { header: 'ID' }),
  helper.accessor((row) => row.departmentName ?? '—', { id: 'department', header: 'Department' }),
  helper.accessor((row) => row.jobTitle ?? row.positionTitle ?? '—', {
    id: 'title',
    header: 'Title',
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor('hireDate', {
    header: 'Hire date',
    cell: ({ getValue }) => formatDate(getValue()),
  }),
])

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)

  const departments = useDepartmentsQuery()
  const query = useEmployeesQuery({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    status: (status as EmployeeListItem['status'] | null) || undefined,
    departmentId: departmentId || undefined,
  })

  const departmentOptions = useMemo(
    () =>
      (departments.data?.data ?? []).map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [departments.data],
  )

  return (
    <>
      <PageHeader
        title="Employees"
        description="Directory of people across the organization"
        actions={
          <Button component={Link} to="/employees/new" leftSection={<Plus size={16} />}>
            Add employee
          </Button>
        }
      />

      <Group mb="md" grow preventGrowOverflow={false} wrap="wrap">
        <TextInput
          placeholder="Search by name, email, or ID"
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            setPage(0)
          }}
          maw={360}
        />
        <Select
          placeholder="Status"
          clearable
          data={[...EMPLOYEE_STATUSES]}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
          maw={180}
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
          maw={220}
        />
      </Group>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.isError && (query.data?.data.length ?? 0) === 0}
        emptyTitle="No employees found"
        emptyDescription="Create an employee or adjust your filters."
      >
        <DataTable
          data={query.data?.data ?? []}
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
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
        />
      </QueryState>
    </>
  )
}
