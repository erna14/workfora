import type { AttendanceSessionState, AttendanceToday } from './types'

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function sessionLabel(state: string | undefined): string {
  switch (state) {
    case 'WORKING':
      return 'Currently working'
    case 'ON_BREAK':
      return 'On break'
    case 'COMPLETED':
      return 'Workday completed'
    case 'NOT_CHECKED_IN':
    default:
      return 'Not checked in'
  }
}

/** Live elapsed times using serverTime sync — no per-second backend refetch. */
export function computeLiveElapsed(
  today: AttendanceToday | undefined,
  nowMs: number,
  /** Client time when `today` was last loaded — defaults to `nowMs` (no extrapolation). */
  syncedAtMs: number = nowMs,
): { gross: number; breakSeconds: number; net: number } {
  if (!today?.record?.checkInAt) {
    return { gross: 0, breakSeconds: 0, net: 0 }
  }

  const serverMs = new Date(today.serverTime).getTime()
  const approxNow = Number.isFinite(serverMs)
    ? serverMs + Math.max(0, nowMs - syncedAtMs)
    : nowMs

  if (today.record.checkOutAt) {
    return {
      gross: today.elapsedGrossSeconds,
      breakSeconds: today.elapsedBreakSeconds,
      net: today.elapsedNetSeconds,
    }
  }

  const checkInMs = new Date(today.record.checkInAt).getTime()
  const gross = Math.max(0, Math.floor((approxNow - checkInMs) / 1000))
  let breakSeconds = Math.max(0, today.record.totalBreakSeconds ?? 0)
  if (today.activeBreak?.startedAt && today.sessionState === 'ON_BREAK') {
    const breakStart = new Date(today.activeBreak.startedAt).getTime()
    breakSeconds += Math.max(0, Math.floor((approxNow - breakStart) / 1000))
  }
  const net = Math.max(0, gross - breakSeconds)
  return { gross, breakSeconds, net }
}

export function isActiveSession(state: AttendanceSessionState | string | undefined): boolean {
  return state === 'WORKING' || state === 'ON_BREAK'
}
