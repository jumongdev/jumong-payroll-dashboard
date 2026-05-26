import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import ClockInOut from "@/components/clock-in-out"
import { Briefcase, Users, Clock, DollarSign } from "lucide-react"

function parseTimeDiff(end: string, start: string): number {
  const [eh, em] = end.split(":").map(Number)
  const [sh, sm] = start.split(":").map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

export default async function EmployeeDashboard() {
  const session = await auth()
  const userId = session?.user?.id!
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const todayStart = new Date(todayStr)
  const todayEnd = new Date(todayStr + "T23:59:59")

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { fullName: true, designation: true, rate: true },
  })

  const todaySchedule = await db.schedule.findFirst({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
      include: {
        company: { select: { name: true, address: true, latitude: true, longitude: true, qrCode: true } },
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

  if (!user) return <p className="text-zinc-500">Account not found.</p>

  const advisory = await db.advisory.findFirst()

  const shiftHours = todaySchedule?.shift
    ? parseTimeDiff(todaySchedule.shift.endTime, todaySchedule.shift.startTime)
    : 12

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-1">{formatDate(today)} &middot; Welcome, {user.fullName}</p>
      </div>

      {advisory?.message && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium text-xs uppercase tracking-wide text-blue-500 mb-1">Advisory</p>
          {advisory.message}
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
              {todaySchedule.company.qrCode && (
                <div className="mt-2 p-2 bg-white rounded-lg border inline-block">
                  <p className="text-xs text-zinc-500 mb-1">Store QR Code</p>
                  <img src={todaySchedule.company.qrCode} alt="Store QR" className="w-24 h-24" />
                </div>
              )}
              {todaySchedule.shift && (
                <p className="text-sm text-emerald-700 mt-1 flex items-center gap-1">
                  <Clock size={14} />
                  Shift: {todaySchedule.shift.name} ({todaySchedule.shift.startTime} - {todaySchedule.shift.endTime})
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
                  <p className="font-medium">How to clock in/out:</p>
                  <p>1. Tap <strong>Take photo</strong> to capture the store front</p>
                  <p>2. Allow <strong>location access</strong> when prompted</p>
                  <p>3. Tap <strong>Clock In</strong> to start your shift</p>
                  <p>4. At end of shift, take another photo & tap <strong>Clock Out</strong></p>
                </div>
              )}
              {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 text-xs text-amber-700">
                  You&apos;re clocked in. Don&apos;t forget to <strong>Clock Out</strong> at the end of your shift.
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
                      const diff = (todayAttendance.checkOut!.getTime() - todayAttendance.checkIn!.getTime()) / 3600000
                      const h = Math.floor(diff)
                      const m = Math.round((diff - h) * 60)
                      return `${h}h ${m}m`
                    })()}
                  </p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">
                    Today&apos;s Pay: {(() => {
                      const diff = (todayAttendance.checkOut!.getTime() - todayAttendance.checkIn!.getTime()) / 3600000
                      const hours = Math.min(diff, shiftHours)
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
          <CardContent className="p-6 text-center">
            <Briefcase size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500">No assignment for today</p>
            <p className="text-xs text-zinc-400 mt-1">Check back later or contact your admin</p>
          </CardContent>
        </Card>
      )}

      {upcomingSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase size={18} />
              Upcoming Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingSchedules.map((s) => {
                return (
                  <div key={s.id} className="p-2 rounded-lg border bg-white">
                    <p className="font-medium text-sm">
                      {formatDate(s.date)} — {s.company.name}
                    </p>
                    {s.shift && (
                      <p className="text-xs text-zinc-500">
                        {s.shift.name} ({s.shift.startTime} - {s.shift.endTime})
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users size={18} />
            Today&apos;s Team ({todayAllSchedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAllSchedules.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No one scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {todayAllSchedules.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg border bg-white">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    {s.user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{s.user.fullName}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {s.user.designation || "Employee"} &middot; {s.company.name}
                      {s.shift ? ` (${s.shift.startTime}-${s.shift.endTime})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
