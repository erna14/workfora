import { Button, Group, Text } from '@mantine/core'
import { Coffee, LogIn, LogOut, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QueryState } from '../../components/ui/QueryState'
import { formatDateTime } from '../../utils/format'
import {
  useAttendanceTodayQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useEndBreakMutation,
  useStartBreakMutation,
} from './hooks'
import { computeLiveElapsed, formatDuration, isActiveSession, sessionLabel } from './utils'
import classes from './AttendanceWidget.module.css'

function statusClass(state: string | undefined): string {
  switch (state) {
    case 'WORKING':
      return classes.stateWorking
    case 'ON_BREAK':
      return classes.stateOnBreak
    case 'COMPLETED':
      return classes.stateCompleted
    default:
      return classes.stateNotCheckedIn
  }
}

export function AttendanceWidget() {
  const query = useAttendanceTodayQuery()
  const checkIn = useCheckInMutation()
  const checkOut = useCheckOutMutation()
  const startBreak = useStartBreakMutation()
  const endBreak = useEndBreakMutation()
  const [now, setNow] = useState(() => Date.now())

  const state = query.data?.sessionState
  const live = isActiveSession(state)

  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])

  const elapsed = computeLiveElapsed(query.data, now)
  const busy =
    checkIn.isPending || checkOut.isPending || startBreak.isPending || endBreak.isPending

  return (
    <section className={classes.widget} aria-label="Today's attendance">
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <div className={classes.header}>
          <div className={classes.titleBlock}>
            <p className={classes.eyebrow}>Attendance</p>
            <h2 className={classes.title}>Today&apos;s session</h2>
          </div>
          <span className={`${classes.statusPill} ${statusClass(state)}`}>
            <span className={classes.statusDot} aria-hidden />
            {sessionLabel(state)}
          </span>
        </div>

        <div className={classes.timerBlock}>
          <p className={classes.timerLabel}>
            <Group gap={6} component="span">
              <Timer size={12} strokeWidth={2} />
              {state === 'ON_BREAK' ? 'Break in progress · net work time' : 'Net working time'}
            </Group>
          </p>
          <p className={classes.timerValue}>{formatDuration(elapsed.net)}</p>
        </div>

        <div className={classes.metrics}>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Check-in</p>
            <p className={classes.metricValue}>
              {formatDateTime(query.data?.record?.checkInAt)}
            </p>
          </div>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Check-out</p>
            <p className={classes.metricValue}>
              {formatDateTime(query.data?.record?.checkOutAt)}
            </p>
          </div>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Break total</p>
            <p className={classes.metricValue}>{formatDuration(elapsed.breakSeconds)}</p>
          </div>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Gross time</p>
            <p className={classes.metricValue}>{formatDuration(elapsed.gross)}</p>
          </div>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Net time</p>
            <p className={classes.metricValue}>{formatDuration(elapsed.net)}</p>
          </div>
          <div className={classes.metric}>
            <p className={classes.metricLabel}>Flags</p>
            <p className={classes.metricValue}>
              {query.data?.record?.late
                ? `Late ${query.data.record.lateMinutes}m`
                : query.data?.record?.overtime
                  ? `OT ${query.data.record.overtimeMinutes}m`
                  : '—'}
            </p>
          </div>
        </div>

        <div className={classes.actions}>
          {state === 'NOT_CHECKED_IN' && (
            <Button
              leftSection={<LogIn size={16} />}
              onClick={() => checkIn.mutate()}
              loading={checkIn.isPending}
              disabled={busy}
            >
              Check in
            </Button>
          )}

          {state === 'WORKING' && (
            <>
              <Button
                variant="light"
                leftSection={<Coffee size={16} />}
                onClick={() => startBreak.mutate()}
                loading={startBreak.isPending}
                disabled={busy}
              >
                Start break
              </Button>
              <Button
                color="dark"
                leftSection={<LogOut size={16} />}
                onClick={() => checkOut.mutate()}
                loading={checkOut.isPending}
                disabled={busy}
              >
                Check out
              </Button>
            </>
          )}

          {state === 'ON_BREAK' && (
            <>
              <Button
                leftSection={<Coffee size={16} />}
                onClick={() => endBreak.mutate()}
                loading={endBreak.isPending}
                disabled={busy}
              >
                End break
              </Button>
              <Text size="sm" c="dimmed">
                Check-out is available after the break ends (or auto-closes on check-out).
              </Text>
              <Button
                variant="subtle"
                color="dark"
                leftSection={<LogOut size={16} />}
                onClick={() => checkOut.mutate()}
                loading={checkOut.isPending}
                disabled={busy}
              >
                Check out (close break)
              </Button>
            </>
          )}

          {state === 'COMPLETED' && (
            <Text size="sm" c="dimmed">
              Session closed for today. Durations are final.
            </Text>
          )}
        </div>
      </QueryState>
    </section>
  )
}
