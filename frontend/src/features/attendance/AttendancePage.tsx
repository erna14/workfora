import { Button, Checkbox, Select, Text, TextInput } from '@mantine/core'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy'
import { useMemo, useState } from 'react'

type SortingState = Array<{ id: string; desc: boolean }>
import { PageHeader } from '../../components/ui/PageHeader'
import { QueryState } from '../../components/ui/QueryState'
import { useAuth } from '../../app/providers/AuthProvider'
import { formatDate, formatDateTime } from '../../utils/format'
import { AttendanceWidget } from './AttendanceWidget'
import {
  useAdminAttendanceQuery,
  useAttendanceHistoryQuery,
  useAttendanceOverviewQuery,
} from './hooks'
import type { AttendanceRecord } from './types'
import { formatDuration, sessionLabel } from './utils'
import classes from './AttendancePage.module.css'

function buildSortParam(sorting: SortingState): string {
  if (!sorting.length) return 'workDate,desc'
  const first = sorting[0]
  return `${first.id},${first.desc ? 'desc' : 'asc'}`
}

export default function AttendancePage() {
  const { hasRole, hasPermission } = useAuth()
  const isManager = hasRole('DEPT_MANAGER', 'HR_ADMIN', 'HR_OFFICER', 'SUPER_ADMIN')
  const canWrite = hasPermission('attendance:write')

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'workDate', desc: true }])
  const [missingCheckout, setMissingCheckout] = useState(false)
  const [lateOnly, setLateOnly] = useState(false)
  const [view, setView] = useState<'mine' | 'team'>('mine')

  const sort = buildSortParam(sorting)
  const historyQuery = useAttendanceHistoryQuery({
    page,
    size: 15,
    sort,
    from: from || undefined,
    to: to || undefined,
  })
  const adminQuery = useAdminAttendanceQuery(
    {
      page,
      size: 15,
      sort,
      from: from || undefined,
      to: to || undefined,
      missingCheckout: missingCheckout || undefined,
      lateOnly: lateOnly || undefined,
    },
    isManager && view === 'team',
  )
  const overviewQuery = useAttendanceOverviewQuery(undefined, isManager)

  const activeQuery = view === 'team' && isManager ? adminQuery : historyQuery
  const rows = activeQuery.data?.data ?? []
  const meta = activeQuery.data?.meta

  const columns = useMemo<LegacyColumnDef<AttendanceRecord>[]>(() => {
    const cols: LegacyColumnDef<AttendanceRecord>[] = []
    if (view === 'team') {
      cols.push({
        accessorKey: 'employeeName',
        header: 'Employee',
        cell: (info) => (info.getValue() as string | null) || '—',
      })
    }
    cols.push(
      {
        accessorKey: 'workDate',
        header: 'Date',
        cell: (info) => formatDate(String(info.getValue() ?? '')),
      },
      {
        accessorKey: 'checkInAt',
        header: 'Check-in',
        cell: (info) => formatDateTime(info.getValue() as string | null),
      },
      {
        accessorKey: 'checkOutAt',
        header: 'Check-out',
        cell: (info) => formatDateTime(info.getValue() as string | null),
      },
      {
        accessorKey: 'totalBreakSeconds',
        header: 'Break',
        cell: (info) => formatDuration(Number(info.getValue() ?? 0)),
      },
      {
        accessorKey: 'netWorkSeconds',
        header: 'Net hours',
        cell: (info) => {
          const value = info.getValue() as number | null
          return value == null ? '—' : formatDuration(value)
        },
      },
      {
        accessorKey: 'sessionState',
        header: 'Status',
        cell: (info) => sessionLabel(String(info.getValue() ?? '')),
      },
      {
        id: 'flags',
        header: 'Flags',
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          const badges: string[] = []
          if (r.late) badges.push(`Late ${r.lateMinutes}m`)
          if (r.overtime) badges.push(`OT ${r.overtimeMinutes}m`)
          if (r.earlyDeparture) badges.push(`Early ${r.earlyDepartureMinutes}m`)
          if (r.missingCheckout) badges.push('Missing checkout')
          if (!badges.length) return '—'
          return (
            <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
              {badges.map((b) => (
                <span
                  key={b}
                  className={`${classes.badge} ${
                    b.startsWith('Late')
                      ? classes.badgeLate
                      : b.startsWith('OT')
                        ? classes.badgeOt
                        : b.startsWith('Missing')
                          ? classes.badgeMissing
                          : ''
                  }`}
                >
                  {b}
                </span>
              ))}
            </span>
          )
        },
      },
    )
    return cols
  }, [view])

  const table = useLegacyTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setPage(0)
      setSorting(updater)
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: meta?.totalPages ?? -1,
  })

  return (
    <div className={classes.page}>
      <PageHeader
        title="Attendance"
        description="Check in and out, track breaks, and review working time."
      />

      {canWrite ? <AttendanceWidget /> : null}

      {isManager && overviewQuery.data ? (
        <div className={classes.overviewGrid}>
          <div className={classes.overviewCard}>
            <p className={classes.overviewLabel}>Working</p>
            <p className={classes.overviewValue}>{overviewQuery.data.workingCount}</p>
          </div>
          <div className={classes.overviewCard}>
            <p className={classes.overviewLabel}>On break</p>
            <p className={classes.overviewValue}>{overviewQuery.data.onBreakCount}</p>
          </div>
          <div className={classes.overviewCard}>
            <p className={classes.overviewLabel}>Completed</p>
            <p className={classes.overviewValue}>{overviewQuery.data.completedCount}</p>
          </div>
          <div className={classes.overviewCard}>
            <p className={classes.overviewLabel}>Late / missing out</p>
            <p className={classes.overviewValue}>
              {overviewQuery.data.lateCount} / {overviewQuery.data.missingCheckoutCount}
            </p>
          </div>
        </div>
      ) : null}

      <section>
        <PageHeader
          title={view === 'team' ? 'Team attendance' : 'My history'}
          description="Filter by date range. Sort columns by clicking headers."
          actions={
            isManager ? (
              <Select
                data={[
                  { value: 'mine', label: 'My history' },
                  { value: 'team', label: 'Team / org records' },
                ]}
                value={view}
                onChange={(v) => {
                  setView((v as 'mine' | 'team') || 'mine')
                  setPage(0)
                }}
                w={200}
              />
            ) : undefined
          }
        />

        <div className={classes.filters}>
          <TextInput
            type="date"
            label="From"
            value={from}
            onChange={(e) => {
              setFrom(e.currentTarget.value)
              setPage(0)
            }}
            w={160}
          />
          <TextInput
            type="date"
            label="To"
            value={to}
            onChange={(e) => {
              setTo(e.currentTarget.value)
              setPage(0)
            }}
            w={160}
          />
          {view === 'team' ? (
            <>
              <Checkbox
                label="Missing check-out"
                checked={missingCheckout}
                onChange={(e) => {
                  setMissingCheckout(e.currentTarget.checked)
                  setPage(0)
                }}
                mt={22}
              />
              <Checkbox
                label="Late only"
                checked={lateOnly}
                onChange={(e) => {
                  setLateOnly(e.currentTarget.checked)
                  setPage(0)
                }}
                mt={22}
              />
            </>
          ) : null}
        </div>

        <QueryState
          isLoading={activeQuery.isLoading}
          isError={activeQuery.isError}
          error={activeQuery.error}
          onRetry={() => void activeQuery.refetch()}
        >
          <div className={classes.tableWrap}>
            <table className={classes.table}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <Text c="dimmed" py="md" px="sm">
                        No attendance records for this range.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={classes.pagination}>
            <Text size="sm" c="dimmed">
              {meta
                ? `${meta.totalElements} record${meta.totalElements === 1 ? '' : 's'}`
                : null}
            </Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="default"
                size="xs"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="default"
                size="xs"
                disabled={!meta || page + 1 >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </QueryState>
      </section>
    </div>
  )
}
