import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import StatsCards from "@/components/stats-cards"
import { Users, DollarSign, ClipboardList, CheckCircle, AlertCircle, Clock, TrendingUp, Building, Calendar } from "lucide-react"
import { formatCurrency, formatDate, getPhilippineToday } from "@/lib/utils"
import { updateAdvisory } from "@/lib/actions/advisory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import BannerUpload from "@/components/banner-upload"
import DailySalarySummary from "@/components/daily-salary-summary"

export default async function DashboardPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard/employee")

  const { start: todayStart, end: todayEnd, dateStr: todayStr } = getPhilippineToday()
  const phToday = new Date(`${todayStr}T12:00:00+08:00`)
  const phYear = phToday.getFullYear()
  const phMonth = phToday.getMonth()

  const [totalEmployees, todaySchedules, todayAttendances, pendingPayroll, recentSalaries, weeklyPayroll, companies, activeDebts, birthdaysThisMonth, advisory] = await Promise.all([
    db.user.count(),
    db.schedule.findMany({
      where: { date: { gte: todayStart, lt: todayEnd } },
      include: {
        user: { select: { fullName: true, rate: true } },
        company: { select: { name: true, earlyInPaid: true, lateOutPaid: true } },
        shift: { select: { startTime: true, endTime: true } },
      },
    }),
    db.attendance.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { user: { select: { fullName: true, rate: true } } },
    }),
    db.payrollEntry.findMany({
      where: { status: "pending" },
      include: { user: { select: { fullName: true } }, payrollPeriod: true },
    }),
    db.salary.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.salary.aggregate({
      _sum: { netSalary: true },
       where: { year: phYear, status: "paid" },
    }),
    db.company.count(),
    db.employeeDebt.findMany({
      where: { remaining: { gt: 0 } },
      include: { user: { select: { fullName: true } } },
    }),
    db.user.findMany({
      where: {
        birthDate: {
          gte: new Date(phYear, phMonth, 1),
          lt: new Date(phYear, phMonth + 1, 1),
        },
      },
      select: { fullName: true, birthDate: true },
      orderBy: { birthDate: "asc" },
    }),
    db.advisory.findFirst(),
  ])

  const clockedIn = todayAttendances.filter(a => a.checkIn && !a.checkOut).length
  const clockedOut = todayAttendances.filter(a => a.checkOut).length
  const absent = todaySchedules.filter(s => !todayAttendances.find(a => a.userId === s.userId)).length

  const debtByUser = new Map<string, { name: string; total: number }>()
  for (const d of activeDebts) {
    const existing = debtByUser.get(d.userId)
    if (existing) existing.total += d.remaining
    else debtByUser.set(d.userId, { name: d.user.fullName, total: d.remaining })
  }
  const totalDebts = [...debtByUser.values()].reduce((s, d) => s + d.total, 0)

  const pendingTotal = pendingPayroll.reduce((s, e) => s + e.netPay, 0)

  const stats = [
    { title: "Total Employees", value: totalEmployees, icon: Users },
    { title: "Companies", value: companies, icon: Building },
    { title: "Clocked In Today", value: clockedIn, icon: CheckCircle },
    { title: "Pending Payroll", value: formatCurrency(pendingTotal), icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-1">Welcome back, {session?.user?.name} &middot; {formatDate(phToday)}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle size={14} />
            Employee Advisory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAdvisory} className="flex gap-2">
            <Input
              name="message"
              defaultValue={advisory?.message || ""}
              placeholder="Write an advisory for all employees..."
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" size="sm" className="h-9">Save</Button>
          </form>
          <BannerUpload currentBanner={advisory?.eventBanner ?? null} />
        </CardContent>
      </Card>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={18} />
              Today&apos;s Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 text-center">
              <div className="flex-1 bg-emerald-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-emerald-700">{clockedOut}</p>
                <p className="text-xs text-zinc-500">Completed</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-amber-700">{clockedIn}</p>
                <p className="text-xs text-zinc-500">Working</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-700">{absent}</p>
                <p className="text-xs text-zinc-500">Absent</p>
              </div>
            </div>
            {todaySchedules.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No schedules for today.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  const byCompany = new Map<string, typeof todaySchedules>()
                  for (const s of todaySchedules) {
                    const key = s.company.name
                    if (!byCompany.has(key)) byCompany.set(key, [])
                    byCompany.get(key)!.push(s)
                  }
                  return [...byCompany.entries()]
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([company, members]) => (
                    <div key={company}>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                        {company} ({members.length})
                      </p>
                      <div className="space-y-1">
                        {members.map((s) => {
                          const att = todayAttendances.find(a => a.userId === s.userId)
                          return (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded border text-sm">
                              <div>
                                <p className="font-medium">{s.user.fullName}</p>
                              </div>
                              <Badge variant={att?.checkOut ? "success" : att?.checkIn ? "warning" : "destructive"}>
                                {att?.checkOut ? "Done" : att?.checkIn ? "In" : "Absent"}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        <DailySalarySummary />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={18} />
              Pending Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayroll.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No pending payroll.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingPayroll.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <p className="font-medium">{e.user.fullName}</p>
                      <p className="text-xs text-zinc-500">
                        {e.totalHours}h &middot; Gross: {formatCurrency(e.grossPay)}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(e.netPay)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Recent Salaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSalaries.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No salary records found.</p>
            ) : (
              <div className="space-y-3">
                {recentSalaries.map((s) => (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.user.fullName}</p>
                      <p className="text-xs text-zinc-500">{s.month} {s.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(s.netSalary)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activeDebts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={18} />
                Outstanding Debts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center mb-3">
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDebts)}</p>
                <p className="text-xs text-red-500">{debtByUser.size} employee{debtByUser.size !== 1 ? "s" : ""}</p>
              </div>
              <div className="space-y-1">
                {[...debtByUser.entries()].map(([id, d]) => (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="text-zinc-600">{d.name}</span>
                    <span className="text-red-600 font-medium">{formatCurrency(d.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {birthdaysThisMonth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} />
                Birthdays This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {birthdaysThisMonth.map((b) => (
                  <div key={b.fullName} className="flex items-center justify-between p-2 rounded border text-sm">
                    <p className="font-medium">{b.fullName}</p>
                    <span className="text-xs text-zinc-500">
                      {new Date(b.birthDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Yearly Payroll {phYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <YearlyPayrollChart year={phYear} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function YearlyPayrollChart({ year }: { year: number }) {
  const salaries = await db.salary.findMany({
    where: { year, status: "paid" },
    select: { netSalary: true, month: true },
  })
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const data = months.map((month) => ({
    month: month.substring(0, 3),
    total: salaries.filter((s) => s.month === month).reduce((sum, s) => sum + s.netSalary, 0),
  }))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-8">{d.month}</span>
          <div className="flex-1 h-5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min((d.total / (Math.max(...data.map((x) => x.total)) || 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium w-20 text-right">{formatCurrency(d.total)}</span>
        </div>
      ))}
    </div>
  )
}
