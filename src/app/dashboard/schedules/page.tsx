import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/dialog"
import { assignSchedule, removeSchedule, copyScheduleToNextWeek } from "@/lib/actions/schedules"
import { formatDate, getPhilippineToday } from "@/lib/utils"
import { Building, Trash2, Plus, Users, AlertCircle } from "lucide-react"

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard/account")

  const params = await searchParams
  const { dateStr: todayStr, start: todayStart, end: todayEnd } = getPhilippineToday()
  const tomorrowStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(Date.now() + 86400000)
  const selectedDate = params.date || todayStr
  const dateStart = new Date(selectedDate)
  const dateEnd = new Date(selectedDate + "T23:59:59")

  const [employees, companies, schedules, attendances, upcomingSummaries] = await Promise.all([
    db.user.findMany({
      where: { role: "employee" },
      select: { id: true, fullName: true, employeeId: true, designation: true },
      orderBy: { fullName: "asc" },
    }),
    db.company.findMany({ include: { shifts: true }, orderBy: { name: "asc" } }),
    db.schedule.findMany({
      where: { date: { gte: dateStart, lt: dateEnd } },
      include: {
        user: { select: { id: true, fullName: true, employeeId: true, designation: true } },
        company: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.attendance.findMany({
      where: { date: { gte: dateStart, lte: dateEnd } },
      select: { userId: true, checkIn: true, status: true },
    }),
    db.schedule.findMany({
      where: { date: { gte: dateStart, lte: new Date(dateStart.getTime() + 7 * 86400000) } },
      include: {
        user: { select: { fullName: true, designation: true } },
        company: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { company: { name: "asc" } }],
    }),
  ])

  const assignedUserIds = new Set(schedules.map((s) => s.userId))
  const availableEmployees = employees.filter((e) => !assignedUserIds.has(e.id))
  const attendanceMap = new Map(attendances.map((a) => [a.userId, a]))
  const totalAssigned = schedules.length

  const present = schedules.filter((s) => attendanceMap.has(s.userId))
  const absent = schedules.filter((s) => !attendanceMap.has(s.userId))

  const summaryByDate = new Map<string, Map<string, typeof upcomingSummaries>>()
  for (const s of upcomingSummaries) {
    const dateKey = s.date.toISOString().split("T")[0]
    if (!summaryByDate.has(dateKey)) summaryByDate.set(dateKey, new Map())
    const companyMap = summaryByDate.get(dateKey)!
    if (!companyMap.has(s.company.name)) companyMap.set(s.company.name, [])
    companyMap.get(s.company.name)!.push(s)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Daily Schedule</h2>
          <p className="text-zinc-500 mt-1">
            {formatDate(dateStart)} &middot; {totalAssigned} assigned &middot; {present.length} present &middot; {absent.length > 0 && <span className="text-red-500">{absent.length} absent</span>}
          </p>
        </div>
        <form className="flex items-center gap-2">
          <Input name="date" type="date" defaultValue={selectedDate} className="h-9 w-40 text-sm" />
          <Button type="submit" size="sm" className="h-9">Go</Button>
          {params.date && (
            <a href="/dashboard/schedules" className="text-xs text-zinc-500 hover:text-zinc-700">Today</a>
          )}
          <form action={copyScheduleToNextWeek}>
            <input type="hidden" name="fromDate" value={selectedDate} />
            <input type="hidden" name="toDate" value={new Date(dateStart.getTime() + 7 * 86400000).toISOString().split("T")[0]} />
            <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">Copy to Next Week</Button>
          </form>
        </form>
      </div>

      {summaryByDate.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...summaryByDate.entries()].map(([dateKey, companyMap]) => (
                <div key={dateKey} className="p-3 rounded-lg border bg-zinc-50/50">
                  <p className="text-sm font-semibold text-zinc-800 mb-2">
                    {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {dateKey === todayStr ? " (Today)" : dateKey === tomorrowStr ? " (Tomorrow)" : ""}
                  </p>
                  <div className="space-y-2">
                    {[...companyMap.entries()].map(([companyName, items]) => (
                      <div key={companyName} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-emerald-700">{companyName}:</span>
                        <span className="text-sm text-zinc-600">
                          {items.map((i) => i.user.fullName).join(", ")}
                        </span>
                        <span className="text-xs text-zinc-400">({items.length})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {absent.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertCircle size={16} />
              Absent ({absent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {absent.map((s) => (
                <form
                  key={s.id}
                  action={async () => {
                    "use server"
                    await db.attendance.upsert({
                      where: { userId_date: { userId: s.userId, date: dateStart } },
                      update: { status: "absent" },
                      create: { userId: s.userId, date: dateStart, status: "absent" },
                    })
                  }}
                >
                  <Button variant="outline" size="sm" className="h-8 text-xs border-red-200 hover:bg-red-100 text-red-700" type="submit">
                    {s.user.fullName} — Mark Absent
                  </Button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {companies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-zinc-500">
            No companies added yet. Go to Companies page first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => {
            const companySchedules = schedules.filter((s) => s.company.id === company.id)

            return (
              <Card key={company.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building size={16} className="text-emerald-600" />
                    {company.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form action={assignSchedule} className="flex flex-col gap-2">
                    <input type="hidden" name="date" value={selectedDate} />
                    <input type="hidden" name="companyId" value={company.id} />
                    <div className="flex gap-2">
                      <Select name="userId" required className="flex-1 h-9 text-sm">
                        <option value="">+ Add employee...</option>
                        {availableEmployees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.designation || "N/A"})
                          </option>
                        ))}
                      </Select>
                      <Select name="shiftId" className="w-36 h-9 text-sm">
                        <option value="">Shift</option>
                        {company.shifts.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                      <Button type="submit" size="sm" className="h-9 shrink-0" disabled={availableEmployees.length === 0}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  </form>

                  {companySchedules.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No employees assigned</p>
                  ) : (
                    <div className="divide-y">
                      {companySchedules.map((s) => {
                        const att = attendanceMap.get(s.userId)
                        return (
                          <div key={s.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                att ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              }`}>
                                {s.user.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{s.user.fullName}</p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {s.user.designation || "Employee"}
                                  {s.shift ? ` · ${s.shift.name}` : ""}
                                  {att?.checkIn ? ` · In: ${att.checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : !att ? " · No clock-in" : ""}
                                </p>
                              </div>
                            </div>
                            <form action={async () => { "use server"; await removeSchedule(s.userId, selectedDate) }}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 size={12} />
                              </Button>
                            </form>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={16} />
              Unassigned Employees ({availableEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-emerald-600">All employees are assigned for today.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableEmployees.map((e) => (
                  <span key={e.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-sm text-zinc-700">
                    {e.fullName}
                    <span className="text-xs text-zinc-400">({e.designation || "N/A"})</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
