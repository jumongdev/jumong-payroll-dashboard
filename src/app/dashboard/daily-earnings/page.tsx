import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, computePaidHours, to12Hour } from "@/lib/utils"
import { DollarSign, ChevronDown, ChevronRight } from "lucide-react"

function toPHTime(d: Date): string {
  const ph = new Date(d.getTime() + 8 * 3600000)
  return `${ph.getUTCHours().toString().padStart(2, "0")}:${ph.getUTCMinutes().toString().padStart(2, "0")}`
}

interface DayEarning {
  userId: string
  name: string
  company: string
  rate: number
  shiftStart: string | null
  shiftEnd: string | null
  checkIn: string | null
  checkOut: string | null
  rawHours: number
  paidHours: number
  pay: number
  status: "done" | "working" | "absent"
  missingShift: boolean
}

async function getEarningsForDate(dateStr: string, userId?: string): Promise<{ date: string; earnings: DayEarning[]; total: number }> {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(`${dateStr}T23:59:59`)

  const scheduleWhere: any = { date: { gte: start, lt: end } }
  const attendanceWhere: any = { date: { gte: start, lte: end } }
  if (userId) {
    scheduleWhere.userId = userId
    attendanceWhere.userId = userId
  }

  const [schedules, attendances] = await Promise.all([
    db.schedule.findMany({
      where: scheduleWhere,
      include: {
        user: { select: { fullName: true, rate: true } },
        company: { select: { name: true, earlyInPaid: true, lateOutPaid: true } },
        shift: { select: { startTime: true, endTime: true } },
      },
    }),
    db.attendance.findMany({ where: attendanceWhere }),
  ])

  const earnings: DayEarning[] = []

  for (const s of schedules) {
    const att = attendances.find((a) => a.userId === s.userId)
    const shiftStart = s.shift?.startTime ?? null
    const shiftEnd = s.shift?.endTime ?? null
    const earlyIn = s.company.earlyInPaid
    const lateOut = s.company.lateOutPaid
    let checkIn: string | null = null
    let checkOut: string | null = null
    let rawHours = 0
    let paidHours = 0
    let status: DayEarning["status"] = "absent"

    if (att?.checkIn && att?.checkOut) {
      checkIn = toPHTime(att.checkIn)
      checkOut = toPHTime(att.checkOut)
      rawHours = (att.checkOut.getTime() - att.checkIn.getTime()) / 3600000
      if (shiftEnd) {
        paidHours = computePaidHours(att.checkIn, att.checkOut, shiftStart!, shiftEnd, dateStr, earlyIn, lateOut)
      }
      status = "done"
    } else if (att?.checkIn) {
      checkIn = toPHTime(att.checkIn)
      rawHours = (new Date().getTime() - att.checkIn.getTime()) / 3600000
      if (shiftEnd) {
        paidHours = computePaidHours(att.checkIn, new Date(), shiftStart!, shiftEnd, dateStr, earlyIn, lateOut)
      }
      status = "working"
    }

    earnings.push({
      userId: s.userId,
      name: s.user.fullName,
      company: s.company.name,
      rate: s.user.rate,
      shiftStart,
      shiftEnd,
      checkIn,
      checkOut,
      rawHours,
      paidHours,
      pay: paidHours * s.user.rate,
      status,
      missingShift: !shiftEnd,
    })
  }

  const total = earnings.reduce((s, e) => s + e.pay, 0)

  return { date: dateStr, earnings, total }
}

export default async function DailyEarningsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const isAdmin = session.user.role === "admin"
  const params = await searchParams

  const phNow = new Date()
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(phNow)
  const sevenDaysAgo = new Date(phNow.getTime() - 6 * 86400000)
  const defaultFrom = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(sevenDaysAgo)

  const fromDate = params.from || defaultFrom
  const toDate = params.to || todayStr

  const dates: string[] = []
  const current = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T23:59:59`)
  while (current <= end) {
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(current))
    current.setDate(current.getDate() + 1)
  }

  const results = await Promise.all(dates.slice(0, 14).map((d) => getEarningsForDate(d, isAdmin ? undefined : session.user.id)))

  const allEmployees = new Set<string>()
  for (const r of results) {
    for (const e of r.earnings) {
      allEmployees.add(e.userId)
    }
  }

  const employeeTotals = new Map<string, { name: string; total: number }>()
  for (const r of results) {
    for (const e of r.earnings) {
      const existing = employeeTotals.get(e.userId)
      if (existing) {
        existing.total += e.pay
      } else {
        employeeTotals.set(e.userId, { name: e.name, total: e.pay })
      }
    }
  }

  const grandTotal = results.reduce((s, r) => s + r.total, 0)

  if (!isAdmin) {
    const myTotal = results.reduce((s, r) => s + r.total, 0)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">My Daily Earnings</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {fromDate} &mdash; {toDate} &middot; Total: {formatCurrency(myTotal)}
            </p>
          </div>
          <form className="flex items-center gap-2">
            <Input name="from" type="date" defaultValue={fromDate} className="h-9 w-36 text-sm" />
            <span className="text-zinc-400 text-sm">to</span>
            <Input name="to" type="date" defaultValue={toDate} className="h-9 w-36 text-sm" />
            <Button type="submit" size="sm" className="h-9">View</Button>
          </form>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign size={16} className="text-emerald-600" />
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-zinc-500 text-xs">
                    <th className="text-left py-2 pr-2 font-medium">Date</th>
                    <th className="text-left py-2 px-2 font-medium">Company</th>
                    <th className="text-center py-2 px-2 font-medium">Shift</th>
                    <th className="text-center py-2 px-2 font-medium">In</th>
                    <th className="text-center py-2 px-2 font-medium">Out</th>
                    <th className="text-center py-2 px-2 font-medium">Hours</th>
                    <th className="text-right py-2 pl-2 font-medium">Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {results.flatMap((r) =>
                    r.earnings.map((e) => (
                      <tr key={r.date} className="border-b last:border-0">
                        <td className="py-2 pr-2 text-xs">
                          {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                        </td>
                        <td className="py-2 px-2 text-xs">{e.company}</td>
                        <td className="py-2 px-2 text-center text-xs">
                          {e.shiftStart && e.shiftEnd ? `${to12Hour(e.shiftStart)}-${to12Hour(e.shiftEnd)}` : <span className="text-red-400">No shift</span>}
                        </td>
                        <td className="py-2 px-2 text-center text-xs">{e.checkIn ?? "—"}</td>
                        <td className="py-2 px-2 text-center text-xs">{e.checkOut ?? "—"}</td>
                        <td className="py-2 px-2 text-center text-xs font-medium text-emerald-700">
                          {e.paidHours > 0 ? `${e.paidHours.toFixed(1)}h` : "—"}
                        </td>
                        <td className="py-2 pl-2 text-right text-xs font-semibold text-emerald-700">
                          {e.pay > 0 ? formatCurrency(e.pay) : e.missingShift && e.status !== "absent" ? <span className="text-amber-500">No shift</span> : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                  {results.every((r) => r.earnings.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">No schedules found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Daily Earnings History</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {fromDate} &mdash; {toDate} &middot; {allEmployees.size} employees &middot; {formatCurrency(grandTotal)}
          </p>
        </div>
        <form className="flex items-center gap-2">
          <Input name="from" type="date" defaultValue={fromDate} className="h-9 w-36 text-sm" />
          <span className="text-zinc-400 text-sm">to</span>
          <Input name="to" type="date" defaultValue={toDate} className="h-9 w-36 text-sm" />
          <Button type="submit" size="sm" className="h-9">View</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign size={16} className="text-emerald-600" />
            Summary by Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-zinc-500 text-xs">
                  <th className="text-left py-2 pr-2 font-medium">Employee</th>
                  {results.map((r) => (
                    <th key={r.date} className="text-right py-2 px-2 font-medium whitespace-nowrap">
                      {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </th>
                  ))}
                  <th className="text-right py-2 pl-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...employeeTotals.entries()]
                  .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                  .map(([userId, emp]) => (
                    <tr key={userId} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium">{emp.name}</td>
                      {results.map((r) => {
                        const e = r.earnings.find((x) => x.userId === userId)
                        return (
                          <td key={r.date} className="py-2 px-2 text-right text-xs">
                            {e && e.pay > 0 ? (
                              <span className={e.missingShift ? "text-amber-500" : "text-emerald-700"}>
                                {formatCurrency(e.pay)}
                              </span>
                            ) : e && e.status === "absent" ? (
                              <span className="text-zinc-300">—</span>
                            ) : (
                              <span className="text-zinc-400">₱0</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="py-2 pl-2 text-right font-semibold text-emerald-700">{formatCurrency(emp.total)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 text-xs font-semibold">
                  <td className="py-2 pr-2">Daily Totals</td>
                  {results.map((r) => (
                    <td key={r.date} className="py-2 px-2 text-right text-emerald-700">{formatCurrency(r.total)}</td>
                  ))}
                  <td className="py-2 pl-2 text-right text-emerald-700">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {results.map((r) => (
          <Card key={r.date} id={`day-${r.date}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>
                  {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="font-bold text-emerald-700">{formatCurrency(r.total)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {r.earnings.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No schedules for this day.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-zinc-500">
                        <th className="text-left py-1.5 pr-2 font-medium">Employee</th>
                        <th className="text-left py-1.5 px-2 font-medium">Shift</th>
                        <th className="text-center py-1.5 px-2 font-medium">In</th>
                        <th className="text-center py-1.5 px-2 font-medium">Out</th>
                        <th className="text-center py-1.5 px-2 font-medium">Raw</th>
                        <th className="text-center py-1.5 px-2 font-medium">Paid</th>
                        <th className="text-right py-1.5 pl-2 font-medium">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.earnings.map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 pr-2">
                            <span className="font-medium">{e.name}</span>
                            <span className="text-zinc-400 ml-1">{e.company}</span>
                          </td>
                          <td className="py-1.5 px-2">
                            {e.shiftStart && e.shiftEnd ? (
                              <span>{to12Hour(e.shiftStart)}-{to12Hour(e.shiftEnd)}</span>
                            ) : (
                              <span className="text-red-400">No shift</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center">{e.checkIn ?? "—"}</td>
                          <td className="py-1.5 px-2 text-center">{e.checkOut ?? "—"}</td>
                          <td className="py-1.5 px-2 text-center">{e.rawHours > 0 ? `${e.rawHours.toFixed(1)}h` : "—"}</td>
                          <td className={`py-1.5 px-2 text-center ${e.missingShift ? "text-amber-500" : e.paidHours > 0 ? "text-emerald-600" : ""}`}>
                            {e.missingShift ? "No shift" : e.paidHours > 0 ? `${e.paidHours.toFixed(1)}h` : "—"}
                          </td>
                          <td className={`py-1.5 pl-2 text-right font-semibold ${e.pay > 0 ? "text-emerald-600" : e.missingShift ? "text-amber-500" : "text-zinc-400"}`}>
                            {e.pay > 0 ? formatCurrency(e.pay) : e.missingShift && e.rawHours > 0 ? "No shift" : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
