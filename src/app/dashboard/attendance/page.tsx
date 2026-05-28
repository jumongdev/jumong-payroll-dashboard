import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { checkIn, checkOut, updateAttendanceStatus, updateAttendanceTime } from "@/lib/actions/attendance"
import { exportAttendanceCSV } from "@/lib/actions/export"
import ExportButton from "@/components/export-button"
import { formatDateTime, formatTime, hoursWorked, getPhilippineToday } from "@/lib/utils"
import { Clock, MapPin, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import EditAttendanceTime from "@/components/edit-attendance-time"

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id
  const params = await searchParams
  const search = params.q || ""

  const recordWhere: any = isAdmin ? {} : { userId: userId! }
  if (search && isAdmin) {
    recordWhere.user = { fullName: { contains: search, mode: "insensitive" } }
  }

  const records = await db.attendance.findMany({
    where: recordWhere,
    include: { user: { select: { fullName: true, designation: true } } },
    orderBy: { date: "desc" },
    take: search ? 100 : 50,
  })

  const { start: todayStart, end: todayEnd } = getPhilippineToday()

  const todayRecord = await db.attendance.findFirst({
    where: {
      userId: userId!,
      date: { gte: todayStart, lte: todayEnd },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Attendance</h2>
          <p className="text-zinc-500 mt-1">
            {records.length} records{search ? ` matching "${search}"` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <form className="flex items-center gap-1">
              <Input name="q" placeholder="Search name..." defaultValue={search} className="h-9 w-44 text-sm" />
              <Button type="submit" size="sm" variant="ghost" className="h-9 px-2">
                <Search size={16} />
              </Button>
              {search && (
                <a href="/dashboard/attendance" className="text-xs text-zinc-500 hover:text-zinc-700">Clear</a>
              )}
            </form>
          )}
          {isAdmin && <ExportButton action={exportAttendanceCSV} label="Export CSV" />}
        </div>
      </div>

      {!isAdmin && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Today&apos;s Attendance</p>
                <p className="text-sm text-zinc-500">
                  {formatDateTime(new Date())}
                </p>
              </div>
              <div className="flex gap-3">
                <form action={async () => {
                  "use server"
                  await checkIn(userId!, new Date(), "", 0, 0)
                }}>
                  <Button disabled={!!todayRecord?.checkIn}>
                    {todayRecord?.checkIn ? `In: ${formatTime(todayRecord.checkIn)}` : "Check In"}
                  </Button>
                </form>
                <form action={async () => {
                  "use server"
                  await checkOut(userId!, new Date(), "", 0, 0)
                }}>
                  <Button
                    variant="outline"
                    disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
                  >
                    {todayRecord?.checkOut ? `Out: ${formatTime(todayRecord.checkOut)}` : "Check Out"}
                  </Button>
                </form>
              </div>
            </div>
            {todayRecord?.checkIn && todayRecord?.checkOut && (
              <p className="text-sm text-emerald-600 mt-2">
                Hours worked: {hoursWorked(todayRecord.checkIn, todayRecord.checkOut)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {isAdmin ? r.user.fullName : formatDateTime(r.date)}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(r.date)} &middot; {r.user.designation || "Employee"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-right">
                      {r.checkIn && <p>In: {formatTime(r.checkIn)}</p>}
                      {r.checkOut && <p>Out: {formatTime(r.checkOut)}</p>}
                      {r.checkIn && r.checkOut && (
                        <p className="text-xs text-zinc-500">
                          {hoursWorked(r.checkIn, r.checkOut)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        r.status === "present" ? "success" : r.status === "late" ? "warning" : "destructive"
                      }
                    >
                      {r.status}
                    </Badge>
                    {isAdmin && (
                      <EditAttendanceTime
                        recordId={r.id}
                        currentIn={r.checkIn}
                        currentOut={r.checkOut}
                      />
                    )}
                  </div>
                </div>

                {(r.checkInPhoto || r.checkOutPhoto) && (
                  <div className="flex gap-2 mt-2">
                    {r.checkInPhoto && (
                      <img src={r.checkInPhoto} alt="Check-in" className="w-16 h-16 rounded-lg object-cover border" />
                    )}
                    {r.checkOutPhoto && (
                      <img src={r.checkOutPhoto} alt="Check-out" className="w-16 h-16 rounded-lg object-cover border" />
                    )}
                  </div>
                )}

                {(r.checkInLat || r.checkOutLat) && (
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    {r.checkInLat && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> In: {r.checkInLat.toFixed(5)}, {r.checkInLng?.toFixed(5)}
                      </span>
                    )}
                    {r.checkOutLat && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> Out: {r.checkOutLat?.toFixed(5)}, {r.checkOutLng?.toFixed(5)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {records.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No attendance records yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
