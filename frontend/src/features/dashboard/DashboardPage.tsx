import { BarChart } from '@mantine/charts'
import { useComputedColorScheme } from '@mantine/core'
import {
  Activity,
  AlertCircle,
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Cake,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  PartyPopper,
  UserCheck,
  UserPlus,
  UserRoundX,
  Users,
  Bell,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { QueryState } from '../../components/ui/QueryState'
import { useAuth } from '../../app/providers/AuthProvider'
import { AttendanceWidget } from '../attendance/AttendanceWidget'
import { formatDate } from '../../utils/format'
import { useDashboardSummaryQuery } from './hooks'
import classes from './DashboardPage.module.css'

function formatMetric(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '0'
}

function percent(part: number, whole: number): string {
  if (!whole) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function formatLongDate(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

function roleLabel(roles: string[] | undefined): string {
  const primary = roles?.[0]
  if (!primary) return 'Employee'
  return primary.replaceAll('_', ' ').toLowerCase()
}

function PanelTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={classes.panelTitleRow}>
      <span className={classes.panelTitleIcon} aria-hidden>
        {icon}
      </span>
      <h2 className={classes.panelTitle}>{children}</h2>
    </div>
  )
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const query = useDashboardSummaryQuery()
  const data = query.data
  const isManager = hasRole('DEPT_MANAGER', 'HR_ADMIN', 'HR_OFFICER', 'SUPER_ADMIN')
  const colorScheme = useComputedColorScheme('light')
  const chartColor = colorScheme === 'dark' ? 'brand.4' : 'brand.6'

  return (
    <div className={classes.page}>
      <header className={classes.header}>
        <div className={classes.headerCopy}>
          <h1 className={classes.title}>
            <span className={classes.panelTitleIcon} style={{ marginRight: 8, verticalAlign: -3 }}>
              <LayoutDashboard size={20} strokeWidth={1.85} />
            </span>
            Overview
          </h1>
          <p className={classes.subtitle}>
            {isManager
              ? 'Workforce status, attendance, and items that need attention.'
              : 'Your people workspace summary and upcoming events.'}
          </p>
        </div>
        <div className={classes.headerMeta}>
          <p className={classes.metaDate}>{formatLongDate()}</p>
          <p className={classes.metaRole}>{roleLabel(user?.roles)}</p>
        </div>
      </header>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <>
            <section className={classes.kpiGrid} aria-label="Workforce metrics">
              <article className={classes.kpi}>
                <div className={classes.kpiTop}>
                  <p className={classes.kpiLabel}>Total employees</p>
                  <span className={classes.iconWell} aria-hidden>
                    <Users size={15} strokeWidth={2} />
                  </span>
                </div>
                <p className={classes.kpiValue}>{formatMetric(data.totalEmployees)}</p>
                <p className={classes.kpiHint}>{formatMetric(data.inactiveEmployees)} inactive</p>
              </article>

              <article className={classes.kpi}>
                <div className={classes.kpiTop}>
                  <p className={classes.kpiLabel}>Active workforce</p>
                  <span className={`${classes.iconWell} ${classes.iconWellSuccess}`} aria-hidden>
                    <UserCheck size={15} strokeWidth={2} />
                  </span>
                </div>
                <p className={classes.kpiValue}>{formatMetric(data.activeEmployees)}</p>
                <p className={classes.kpiHint}>
                  {percent(data.activeEmployees, data.totalEmployees)} of headcount
                </p>
              </article>

              <article className={classes.kpi}>
                <div className={classes.kpiTop}>
                  <p className={classes.kpiLabel}>New hires (30 days)</p>
                  <span className={classes.iconWell} aria-hidden>
                    <UserPlus size={15} strokeWidth={2} />
                  </span>
                </div>
                <p className={classes.kpiValue}>{formatMetric(data.newHires)}</p>
                <p className={classes.kpiHint}>Recent additions</p>
              </article>

              <article className={classes.kpi}>
                <div className={classes.kpiTop}>
                  <p className={classes.kpiLabel}>Currently on leave</p>
                  <span className={`${classes.iconWell} ${classes.iconWellWarning}`} aria-hidden>
                    <CalendarClock size={15} strokeWidth={2} />
                  </span>
                </div>
                <p className={classes.kpiValue}>{formatMetric(data.onLeave)}</p>
                <p className={classes.kpiHint}>
                  {formatMetric(data.pendingLeaveRequests)} pending approvals
                </p>
              </article>
            </section>

            <div className={classes.grid}>
              <div className={classes.stack}>
                <AttendanceWidget />

                {isManager ? (
                  <section className={classes.panel}>
                    <div className={classes.panelHeader}>
                      <PanelTitle icon={<Building2 size={16} strokeWidth={1.9} />}>
                        Headcount by department
                      </PanelTitle>
                      <Link to="/organization/departments" className={classes.panelAction}>
                        Manage
                      </Link>
                    </div>
                    <div className={classes.panelBody}>
                      {(data.headcountByDepartment?.length ?? 0) === 0 ? (
                        <p className={classes.empty}>
                          No department headcount is available yet. Assign employees to departments
                          to populate this chart.
                        </p>
                      ) : (
                        <div className={classes.chartWrap}>
                          <BarChart
                            h={240}
                            data={data.headcountByDepartment}
                            dataKey="name"
                            series={[{ name: 'count', color: chartColor, label: 'Employees' }]}
                            tickLine="y"
                            gridAxis="y"
                            withLegend={false}
                          />
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}

                <section className={classes.panel}>
                  <div className={classes.panelHeader}>
                    <PanelTitle icon={<Clock3 size={16} strokeWidth={1.9} />}>
                      Attendance today
                    </PanelTitle>
                    <Link to="/attendance" className={classes.panelAction}>
                      View records
                    </Link>
                  </div>
                  <div className={classes.panelBody}>
                    <div className={classes.attendanceRow}>
                      <div className={classes.attendanceCell}>
                        <div className={classes.attendanceTop}>
                          <p className={classes.attendanceLabel}>Present</p>
                          <span className={`${classes.iconWell} ${classes.iconWellSuccess}`} aria-hidden>
                            <CheckCircle2 size={14} strokeWidth={2} />
                          </span>
                        </div>
                        <p className={classes.attendanceValue}>
                          {formatMetric(data.attendanceToday?.present)}
                        </p>
                      </div>
                      <div className={classes.attendanceCell}>
                        <div className={classes.attendanceTop}>
                          <p className={classes.attendanceLabel}>Late</p>
                          <span className={`${classes.iconWell} ${classes.iconWellWarning}`} aria-hidden>
                            <Clock3 size={14} strokeWidth={2} />
                          </span>
                        </div>
                        <p className={classes.attendanceValue}>
                          {formatMetric(data.attendanceToday?.late)}
                        </p>
                      </div>
                      <div className={classes.attendanceCell}>
                        <div className={classes.attendanceTop}>
                          <p className={classes.attendanceLabel}>Absent</p>
                          <span className={`${classes.iconWell} ${classes.iconWellDanger}`} aria-hidden>
                            <UserRoundX size={14} strokeWidth={2} />
                          </span>
                        </div>
                        <p className={classes.attendanceValue}>
                          {formatMetric(data.attendanceToday?.absent)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={classes.panel}>
                  <div className={classes.panelHeader}>
                    <PanelTitle icon={<Activity size={16} strokeWidth={1.9} />}>
                      Recent activity
                    </PanelTitle>
                  </div>
                  <div className={classes.panelBody}>
                    {(data.recentActivities?.length ?? 0) === 0 ? (
                      <p className={classes.empty}>No audited activity has been recorded yet.</p>
                    ) : (
                      <div className={classes.list}>
                        {data.recentActivities.slice(0, 7).map((item) => (
                          <div key={item.id} className={classes.listItem}>
                            <div className={classes.listLeft}>
                              <span className={`${classes.iconWell} ${classes.iconWellNeutral}`} aria-hidden>
                                <Activity size={14} strokeWidth={2} />
                              </span>
                              <div>
                                <p className={classes.listName}>{item.action}</p>
                                <p className={classes.listDetail}>
                                  {item.details ?? item.entityType ?? 'System event'}
                                </p>
                              </div>
                            </div>
                            <span className={classes.listMeta}>{formatDate(item.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className={classes.stack}>
                {isManager ? (
                  <section className={classes.panel}>
                    <div className={classes.panelHeader}>
                      <PanelTitle icon={<AlertCircle size={16} strokeWidth={1.9} />}>
                        Requires attention
                      </PanelTitle>
                    </div>
                    <div className={classes.panelBody}>
                      <div className={classes.attentionList}>
                        <Link to="/leave" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={`${classes.iconWell} ${classes.iconWellWarning}`} aria-hidden>
                              <CalendarClock size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Leave approvals</p>
                              <p className={classes.attentionDesc}>Requests awaiting review</p>
                            </div>
                          </div>
                          <span className={classes.attentionValue}>
                            {formatMetric(data.pendingLeaveRequests)}
                          </span>
                        </Link>
                        <Link to="/recruitment" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={classes.iconWell} aria-hidden>
                              <BriefcaseBusiness size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Open positions</p>
                              <p className={classes.attentionDesc}>Active job postings</p>
                            </div>
                          </div>
                          <span className={classes.attentionValue}>
                            {formatMetric(data.openJobPostings)}
                          </span>
                        </Link>
                        <Link to="/notifications" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={classes.iconWell} aria-hidden>
                              <Bell size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Unread notifications</p>
                              <p className={classes.attentionDesc}>Inbox items</p>
                            </div>
                          </div>
                          <span className={classes.attentionValue}>
                            {formatMetric(data.unreadNotifications)}
                          </span>
                        </Link>
                        <Link to="/employees" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={classes.iconWell} aria-hidden>
                              <Users size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Employee directory</p>
                              <p className={classes.attentionDesc}>Browse and manage people</p>
                            </div>
                          </div>
                          <ChevronRight size={16} strokeWidth={1.8} aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className={classes.panel}>
                    <div className={classes.panelHeader}>
                      <PanelTitle icon={<LayoutDashboard size={16} strokeWidth={1.9} />}>
                        Quick links
                      </PanelTitle>
                    </div>
                    <div className={classes.panelBody}>
                      <div className={classes.attentionList}>
                        <Link to="/employees" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={classes.iconWell} aria-hidden>
                              <Users size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Directory</p>
                              <p className={classes.attentionDesc}>Find colleagues</p>
                            </div>
                          </div>
                          <ChevronRight size={16} strokeWidth={1.8} aria-hidden />
                        </Link>
                        <Link to="/leave" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={`${classes.iconWell} ${classes.iconWellWarning}`} aria-hidden>
                              <CalendarClock size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Leave</p>
                              <p className={classes.attentionDesc}>Balances and requests</p>
                            </div>
                          </div>
                          <ChevronRight size={16} strokeWidth={1.8} aria-hidden />
                        </Link>
                        <Link to="/attendance" className={classes.attentionItem}>
                          <div className={classes.attentionLeft}>
                            <span className={classes.iconWell} aria-hidden>
                              <Clock3 size={15} strokeWidth={2} />
                            </span>
                            <div>
                              <p className={classes.attentionLabel}>Attendance</p>
                              <p className={classes.attentionDesc}>Check-in and history</p>
                            </div>
                          </div>
                          <ChevronRight size={16} strokeWidth={1.8} aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </section>
                )}

                <section className={classes.panel}>
                  <div className={classes.panelHeader}>
                    <PanelTitle icon={<PartyPopper size={16} strokeWidth={1.9} />}>
                      Upcoming events
                    </PanelTitle>
                  </div>
                  <div className={classes.panelBody}>
                    {(data.upcomingBirthdays?.length ?? 0) === 0 &&
                    (data.upcomingAnniversaries?.length ?? 0) === 0 ? (
                      <p className={classes.empty}>
                        No birthdays or work anniversaries in the next 60 days.
                      </p>
                    ) : (
                      <div className={classes.list}>
                        {(data.upcomingBirthdays ?? []).slice(0, 5).map((item) => (
                          <div key={`b-${item.employeeId}`} className={classes.listItem}>
                            <div className={classes.listLeft}>
                              <span className={classes.iconWell} aria-hidden>
                                <Cake size={14} strokeWidth={2} />
                              </span>
                              <div>
                                <p className={classes.listName}>
                                  {item.name}
                                  <span className={classes.tag}>Birthday</span>
                                </p>
                                <p className={classes.listDetail}>Employee milestone</p>
                              </div>
                            </div>
                            <span className={classes.listMeta}>{formatDate(item.date)}</span>
                          </div>
                        ))}
                        {(data.upcomingAnniversaries ?? []).slice(0, 5).map((item) => (
                          <div key={`a-${item.employeeId}`} className={classes.listItem}>
                            <div className={classes.listLeft}>
                              <span className={`${classes.iconWell} ${classes.iconWellNeutral}`} aria-hidden>
                                <Award size={14} strokeWidth={2} />
                              </span>
                              <div>
                                <p className={classes.listName}>
                                  {item.name}
                                  <span className={`${classes.tag} ${classes.tagMuted}`}>
                                    {item.years}y
                                  </span>
                                </p>
                                <p className={classes.listDetail}>Work anniversary</p>
                              </div>
                            </div>
                            <span className={classes.listMeta}>{formatDate(item.date)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  )
}
