import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { checkIn, checkOut } from "@/lib/actions/attendance"
import { formatDateTime, formatTime, hoursWorked } from "@/lib/utils"
import { Clock } from "lucide-react"

export default async function AttendancePage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id

  const records = await db.attendance.findMany({
    where: isAdmin ? {} : { userId: userId! },
    include: { user: { select: { fullName: true } } },
    orderBy: { date: "desc" },
    take: 50,
  })

  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const todayRecord = await db.attendance.findFirst({
    where: {
      userId: userId!,
      date: { gte: todayStart, lte: todayEnd },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Attendance</h2>
          <p className="text-zinc-500 mt-1">
            {records.length} records
          </p>
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
                  await checkIn(userId!, new Date())
                }}>
                  <Button disabled={!!todayRecord?.checkIn}>
                    {todayRecord?.checkIn ? `In: ${formatTime(todayRecord.checkIn)}` : "Check In"}
                  </Button>
                </form>
                <form action={async () => {
                  "use server"
                  await checkOut(userId!, new Date())
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
          <div className="space-y-2">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="text-sm font-medium">
                    {isAdmin ? r.user.fullName : formatDateTime(r.date)}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-zinc-500">{formatDateTime(r.date)}</p>
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
                </div>
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
