import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { formatDate, formatDateTime, fullName } from '../../utils/format'
import { EmployeeForm } from './EmployeeForm'
import {
  useActivateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useEmployeeQuery,
  useUpdateEmployeeMutation,
} from './hooks'
import type { EmployeeFormValues } from './schemas'

export default function EmployeeProfilePage() {
  const { id = '' } = useParams()
  const [editing, setEditing] = useState(false)
  const query = useEmployeeQuery(id)
  const updateMutation = useUpdateEmployeeMutation(id)
  const deactivateMutation = useDeactivateEmployeeMutation()
  const activateMutation = useActivateEmployeeMutation()

  const employee = query.data

  return (
    <>
      <PageHeader
        title={employee ? fullName(employee.firstName, employee.lastName) : 'Employee'}
        description={employee?.workEmail}
        breadcrumbs={
          <Button
            variant="subtle"
            color="slate"
            size="compact-sm"
            leftSection={<ArrowLeft size={14} />}
            component={Link}
            to="/employees"
          >
            Back to directory
          </Button>
        }
        actions={
          employee ? (
            <Group>
              {employee.status === 'ACTIVE' ? (
                <Button
                  variant="light"
                  color="red"
                  loading={deactivateMutation.isPending}
                  onClick={() => void deactivateMutation.mutateAsync(employee.id)}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="light"
                  loading={activateMutation.isPending}
                  onClick={() => void activateMutation.mutateAsync(employee.id)}
                >
                  Activate
                </Button>
              )}
              <Button
                leftSection={<Pencil size={16} />}
                variant={editing ? 'default' : 'filled'}
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Cancel edit' : 'Edit'}
              </Button>
            </Group>
          ) : null
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !employee}
        emptyTitle="Employee not found"
      >
        {employee ? (
          editing ? (
            <Paper withBorder p="lg">
              <EmployeeForm
                employee={employee}
                submitLabel="Save changes"
                onCancel={() => setEditing(false)}
                onSubmit={async (values: EmployeeFormValues) => {
                  await updateMutation.mutateAsync({
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
                  setEditing(false)
                }}
              />
            </Paper>
          ) : (
            <Stack gap="md">
              <Paper withBorder p="lg">
                <Group>
                  <UserAvatar
                    firstName={employee.firstName}
                    lastName={employee.lastName}
                    size={64}
                  />
                  <div>
                    <Group gap="sm">
                      <Title order={3}>{fullName(employee.firstName, employee.lastName)}</Title>
                      <StatusBadge status={employee.status} />
                    </Group>
                    <Text c="dimmed">{employee.jobTitle ?? employee.positionTitle ?? '—'}</Text>
                    <Text size="sm">{employee.employeeNumber}</Text>
                  </div>
                </Group>
              </Paper>

              <Tabs defaultValue="overview">
                <Tabs.List>
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="employment">Employment</Tabs.Tab>
                  <Tabs.Tab value="contacts">Emergency contacts</Tabs.Tab>
                  <Tabs.Tab value="documents">Documents</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <Info label="Work email" value={employee.workEmail} />
                    <Info label="Personal email" value={employee.personalEmail} />
                    <Info label="Phone" value={employee.phone} />
                    <Info label="Department" value={employee.departmentName} />
                    <Info label="Team" value={employee.teamName} />
                    <Info label="Location" value={employee.locationName} />
                    <Info label="Manager" value={employee.managerName} />
                    <Info label="Hire date" value={formatDate(employee.hireDate)} />
                    <Info label="Date of birth" value={formatDate(employee.dateOfBirth)} />
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="employment" pt="md">
                  {(employee.employmentHistory?.length ?? 0) === 0 ? (
                    <Text c="dimmed" size="sm">
                      No employment history on file.
                    </Text>
                  ) : (
                    <Stack gap="sm">
                      {employee.employmentHistory.map((item) => (
                        <Paper key={item.id} withBorder p="md">
                          <Text fw={500}>{item.title}</Text>
                          <Text size="sm" c="dimmed">
                            {item.departmentName ?? '—'} · {formatDate(item.startedOn)} –{' '}
                            {formatDate(item.endedOn)}
                          </Text>
                          {item.notes ? <Text size="sm" mt={4}>{item.notes}</Text> : null}
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="contacts" pt="md">
                  {(employee.emergencyContacts?.length ?? 0) === 0 ? (
                    <Text c="dimmed" size="sm">
                      No emergency contacts on file.
                    </Text>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      {employee.emergencyContacts.map((contact) => (
                        <Paper key={contact.id} withBorder p="md">
                          <Text fw={500}>{contact.name}</Text>
                          <Text size="sm" c="dimmed">
                            {contact.relationship ?? 'Contact'}
                          </Text>
                          <Text size="sm">{contact.phone}</Text>
                          {contact.email ? <Text size="sm">{contact.email}</Text> : null}
                        </Paper>
                      ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="documents" pt="md">
                  {(employee.documents?.length ?? 0) === 0 ? (
                    <Text c="dimmed" size="sm">
                      No documents uploaded.
                    </Text>
                  ) : (
                    <Stack gap="sm">
                      {employee.documents.map((doc) => (
                        <Paper key={doc.id} withBorder p="md">
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>{doc.fileName}</Text>
                              <Text size="sm" c="dimmed">
                                {formatDateTime(doc.uploadedAt)}
                              </Text>
                            </div>
                            {doc.category ? <Badge variant="light">{doc.category}</Badge> : null}
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Stack>
          )
        ) : null}
      </QueryState>
    </>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text mt={4}>{value || '—'}</Text>
    </Paper>
  )
}
