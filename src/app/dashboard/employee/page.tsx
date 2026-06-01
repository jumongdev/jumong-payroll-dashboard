import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency, getPhilippineToday, to12Hour, getPhilippineWeekRange, computePaidHours } from "@/lib/utils"
import ClockInOut from "@/components/clock-in-out"
import ClickableImage from "@/components/clickable-image"
import { Briefcase, Users, Clock, DollarSign } from "lucide-react"

export default async function EmployeeDashboard() {
  const session = await auth()
  const userId = session?.user?.id!
  const { start: todayStart, end: todayEnd, dateStr: todayStr } = getPhilippineToday()
  const phToday = new Date(`${todayStr}T12:00:00+08:00`)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { fullName: true, designation: true, rate: true, mobile: true, address: true, birthDate: true, gender: true },
  })

  if (!user) return <p className="text-zinc-500">Account not found.</p>

  if (!user.mobile || !user.address || !user.birthDate || !user.gender) {
    redirect("/dashboard/account")
  }

  const todaySchedule = await db.schedule.findFirst({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    include: {
      company: { select: { name: true, address: true, latitude: true, longitude: true, storeImages: { orderBy: { order: "asc" } }, earlyInPaid: true, lateOutPaid: true } },
      shift: { select: { name: true, startTime: true, endTime: true } },
    },
  })

  const todayAllSchedules = await db.schedule.findMany({
    where: { date: { gte: todayStart, lt: todayEnd } },
    include: {
      user: { select: { fullName: true, employeeId: true, designation: true } },
      company: { select: { name: true } },
      shift: { select: { name: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const todayAttendance = await db.attendance.findFirst({
    where: { userId, date: { gte: todayStart, lte: todayEnd } },
  })

  const upcomingSchedules = await db.schedule.findMany({
    where: { userId, date: { gt: todayEnd } },
    include: {
      company: { select: { name: true, address: true } },
      shift: { select: { name: true, startTime: true, endTime: true } },
    },
    orderBy: { date: "asc" },
    take: 10,
  })

  const { monday: weekStart, sunday: weekEnd } = getPhilippineWeekRange()
  const weeklyAttendances = await db.attendance.findMany({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
    orderBy: { date: "asc" },
  })

  const weeklySchedules = await db.schedule.findMany({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
    include: { shift: { select: { startTime: true, endTime: true } }, company: { select: { earlyInPaid: true, lateOutPaid: true } } },
  })

  const weeklyHours = weeklyAttendances.reduce((sum, a) => {
    if (a.checkIn && a.checkOut) {
      const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(a.date)
      const sched = weeklySchedules.find(
        (s) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(s.date) === dateStr
      )
      if (sched?.shift) {
        return sum + computePaidHours(a.checkIn, a.checkOut, sched.shift.startTime, sched.shift.endTime, dateStr, sched.company.earlyInPaid, sched.company.lateOutPaid)
      }
      return sum + (a.checkOut.getTime() - a.checkIn.getTime()) / 3600000
    }
    return sum
  }, 0)
  const weeklyPay = weeklyHours * (user?.rate || 0)
  const daysWorked = weeklyAttendances.filter(a => a.checkIn && a.checkOut).length

  const advisory = await db.advisory.findFirst()

  const debtTrail = await db.debtTransaction.findMany({
    where: { debt: { userId } },
    include: { debt: { select: { type: true, description: true, amount: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">{formatDate(phToday)} &middot; Welcome, <span className="font-medium text-zinc-700">{user.fullName}</span></p>
      </div>

      {advisory?.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <p className="font-semibold text-xs uppercase tracking-wider text-blue-500">Advisory</p>
          </div>
          {advisory.message}
        </div>
      )}

      {advisory?.eventBanner && (
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <img src={advisory.eventBanner} alt="Event banner" className="w-full h-auto object-cover" />
        </div>
      )}

      {todaySchedule && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase size={18} />
              Today&apos;s Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-lg">{todaySchedule.company.name}</p>
              {todaySchedule.company.address && (
                <p className="text-sm text-zinc-500">{todaySchedule.company.address}</p>
              )}
              {todaySchedule.company.storeImages.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {todaySchedule.company.storeImages.map((img) => (
                    <ClickableImage key={img.id} src={img.image} alt={img.title} title={img.title} />
                  ))}
                </div>
              )}
              {todaySchedule.shift && (
                <p className="text-sm text-emerald-700 mt-1 flex items-center gap-1">
                  <Clock size={14} />
                  Shift: {todaySchedule.shift.name} ({to12Hour(todaySchedule.shift.startTime)} - {to12Hour(todaySchedule.shift.endTime)})
                </p>
              )}
              <p className="text-xs text-zinc-500 mt-1">
                Rate: {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(user.rate)}/hr
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-1">
                <Clock size={14} /> Attendance
              </p>
              {!todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-800 space-y-1">
                  <p className="font-medium">Paano mag-time in/out:</p>
                  <p>1. Pindutin ang <strong>Take photo</strong> para kunan ang store</p>
                  <p>2. Payagan ang <strong>location access</strong> kapag hiningi</p>
                  <p>3. Pindutin ang <strong>Clock In</strong> para simulan ang shift</p>
                  <p>4. Sa dulo ng shift, kumuha ulit ng litrato at pindutin ang <strong>Clock Out</strong></p>
                </div>
              )}
              {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 text-xs text-amber-700">
                  Naka-time in ka na. Wag kalimutang mag-<strong>Clock Out</strong> sa dulo ng shift.
                </div>
              )}
              <ClockInOut
                userId={userId}
                companyLat={todaySchedule.company.latitude ?? null}
                companyLng={todaySchedule.company.longitude ?? null}
                todayRecord={todayAttendance ? {
                  checkIn: todayAttendance.checkIn?.toISOString() ?? null,
                  checkOut: todayAttendance.checkOut?.toISOString() ?? null,
                  checkInPhoto: todayAttendance.checkInPhoto,
                  checkOutPhoto: todayAttendance.checkOutPhoto,
                  checkInLat: todayAttendance.checkInLat,
                } : null}
              />
              {todayAttendance?.checkIn && todayAttendance?.checkOut && (
                <>
                  <p className="text-sm text-emerald-600 mt-2">
                    Hours: {(() => {
                      const hours = todaySchedule?.shift?.endTime
                        ? computePaidHours(todayAttendance.checkIn!, todayAttendance.checkOut!, todaySchedule.shift.startTime, todaySchedule.shift.endTime, todayStr, todaySchedule.company.earlyInPaid, todaySchedule.company.lateOutPaid)
                        : (todayAttendance.checkOut!.getTime() - todayAttendance.checkIn!.getTime()) / 3600000
                      const h = Math.floor(hours)
                      const m = Math.round((hours - h) * 60)
                      return `${h}h ${m}m`
                    })()}
                  </p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">
                    Today&apos;s Pay: {(() => {
                      const hours = todaySchedule?.shift?.endTime
                        ? computePaidHours(todayAttendance.checkIn!, todayAttendance.checkOut!, todaySchedule.shift.startTime, todaySchedule.shift.endTime, todayStr, todaySchedule.company.earlyInPaid, todaySchedule.company.lateOutPaid)
                        : (todayAttendance.checkOut!.getTime() - todayAttendance.checkIn!.getTime()) / 3600000
                      const pay = hours * (user.rate || 0)
                      return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(pay)
                    })()}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!todaySchedule && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <Briefcase size={24} className="text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-600">Walang assignment ngayong araw</p>
            <p className="text-xs text-zinc-400 mt-1">Balik ka mamaya o kontakin ang admin</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-600" />
            Weekly Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3">
              <p className="text-xl font-bold text-emerald-700">{daysWorked}</p>
              <p className="text-[10px] text-zinc-500 font-medium">Araw nagtrabaho</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3">
              <p className="text-xl font-bold text-blue-700">{weeklyHours.toFixed(1)}</p>
              <p className="text-[10px] text-zinc-500 font-medium">Oras</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3">
              <p className="text-lg font-bold text-amber-700">{formatCurrency(weeklyPay)}</p>
              <p className="text-[10px] text-zinc-500 font-medium">Kita ngayong linggo</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium">
            {new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(weekStart)} - {new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(weekEnd)}
          </p>
        </CardContent>
      </Card>

      {upcomingSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-600" />
              Upcoming Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {upcomingSchedules.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-zinc-50/80">
                  <p className="font-medium text-sm text-zinc-800">
                    {formatDate(s.date)} — {s.company.name}
                  </p>
                  {s.shift && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {s.shift.name} ({to12Hour(s.shift.startTime)} - {to12Hour(s.shift.endTime)})
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {debtTrail.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={18} className="text-red-500" />
              Debt Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {debtTrail.map((t) => (
                <div key={t.id} className="flex items-start justify-between py-1.5 px-2 rounded bg-zinc-50 text-xs">
                  <div>
                    <p>
                      <span className={t.type === "deduct" ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                        {t.type === "deduct" ? "—" : "+"} {formatCurrency(t.amount < 0 ? -t.amount : t.amount)}
                      </span>
                      <span className="text-zinc-400 ml-1 capitalize">{t.debt.type.replace("_", " ")}</span>
                    </p>
                    <p className="text-zinc-400 text-[10px]">
                      {t.source || ""}{t.notes && t.source ? ` · ${t.notes}` : t.notes || ""}
                    </p>
                  </div>
                  <span className="text-zinc-400 text-[10px] shrink-0 ml-2">
                    {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
            <Users size={18} className="text-emerald-600" />
            Today&apos;s Team ({todayAllSchedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAllSchedules.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No one scheduled today.</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const byCompany = new Map<string, typeof todayAllSchedules>()
                for (const s of todayAllSchedules) {
                  const key = s.company.name
                  if (!byCompany.has(key)) byCompany.set(key, [])
                  byCompany.get(key)!.push(s)
                }
                return [...byCompany.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([company, members]) => (
                    <div key={company}>
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
                        {company} ({members.length})
                      </p>
                      <div className="space-y-1">
                        {members.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50/80">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {s.user.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{s.user.fullName}</p>
                              <p className="text-xs text-zinc-500 truncate">
                                {s.user.designation || "Employee"}
                                {s.shift ? ` (${to12Hour(s.shift.startTime)}-${to12Hour(s.shift.endTime)})` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
