import { Paper } from '@mantine/core'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmployeeForm } from './EmployeeForm'
import { useCreateEmployeeMutation } from './hooks'
import type { EmployeeFormValues } from './schemas'

export default function EmployeeCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateEmployeeMutation()

  return (
    <>
      <PageHeader
        title="Add employee"
        description="Create a new employee record"
      />
      <Paper withBorder p="lg">
        <EmployeeForm
          submitLabel="Create employee"
          onCancel={() => navigate('/employees')}
          onSubmit={async (values: EmployeeFormValues) => {
            const created = await createMutation.mutateAsync({
              ...values,
              personalEmail: values.personalEmail || null,
              phone: values.phone || null,
              hireDate: values.hireDate || null,
              dateOfBirth: values.dateOfBirth || null,
              departmentId: values.departmentId || null,
              positionId: values.positionId || null,
              teamId: values.teamId || null,
              managerId: values.managerId || null,
              locationId: values.locationId || null,
              jobTitle: values.jobTitle || null,
            })
            navigate(`/employees/${created.id}`)
          }}
        />
      </Paper>
    </>
  )
}
