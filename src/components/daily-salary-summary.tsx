import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, getPhilippineToday, computePaidHours, to12Hour, cn } from "@/lib/utils"
import { DollarSign } from "lucide-react"

function toPHTime(d: Date): string {
  const ph = new Date(d.getTime() + 8 * 3600000)
  const h = ph.getUTCHours().toString().padStart(2, "0")
  const m = ph.getUTCMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

export default async function DailySalarySummary() {
  const { start: todayStart, end: todayEnd, dateStr: todayStr } = getPhilippineToday()

  const [schedules, attendances] = await Promise.all([
    db.schedule.findMany({
      where: { date: { gte: todayStart, lt: todayEnd } },
      include: {
        user: { select: { fullName: true, rate: true } },
        company: { select: { name: true, earlyInPaid: true, lateOutPaid: true } },
        shift: { select: { startTime: true, endTime: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.attendance.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { user: { select: { fullName: true, rate: true } } },
    }),
  ])

  interface Row {
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

  const rows: Row[] = []

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
    let status: Row["status"] = "absent"
    let missingShift = !shiftEnd

    if (att?.checkIn && att?.checkOut) {
      checkIn = toPHTime(att.checkIn)
      checkOut = toPHTime(att.checkOut)
      rawHours = (att.checkOut.getTime() - att.checkIn.getTime()) / 3600000
      paidHours = shiftEnd
        ? computePaidHours(att.checkIn, att.checkOut, shiftStart!, shiftEnd, todayStr, earlyIn, lateOut)
        : 0
      status = "done"
    } else if (att?.checkIn) {
      checkIn = toPHTime(att.checkIn)
      checkOut = null
      rawHours = (new Date().getTime() - att.checkIn.getTime()) / 3600000
      paidHours = shiftEnd
        ? computePaidHours(att.checkIn, new Date(), shiftStart!, shiftEnd, todayStr, earlyIn, lateOut)
        : 0
      status = "working"
    }

    rows.push({
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
      missingShift,
    })
  }

  const totalPay = rows.reduce((s, r) => s + r.pay, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign size={18} className="text-emerald-600" />
          Daily Salary Summary ({todayStr})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No schedules for today.</p>
        ) : (
          <>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-zinc-500 font-medium">Total Expected Today</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPay)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-zinc-400 uppercase tracking-wide">
                    <th className="text-left py-2 pr-3 font-medium">Employee</th>
                    <th className="text-center py-2 px-1 font-medium whitespace-nowrap">Shift</th>
                    <th className="text-center py-2 px-1 font-medium whitespace-nowrap">In</th>
                    <th className="text-center py-2 px-1 font-medium whitespace-nowrap">Out</th>
                    <th className="text-center py-2 px-1 font-medium whitespace-nowrap">Raw</th>
                    <th className="text-center py-2 px-1 font-medium whitespace-nowrap">Paid</th>
                    <th className="text-right py-2 pl-3 font-medium">Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={cn("border-b last:border-0", r.status === "absent" && "text-zinc-400")}>
                      <td className="py-1.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          {r.status === "done" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                          {r.status === "working" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                          {r.status === "absent" && <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />}
                          <span className="font-medium">{r.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{r.company}</span>
                      </td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap">
                        {r.shiftStart && r.shiftEnd ? (
                          <span>{to12Hour(r.shiftStart)}&ndash;{to12Hour(r.shiftEnd)}</span>
                        ) : (
                          <span className="text-red-400 text-[10px]">No shift</span>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap font-mono">{r.checkIn ?? "—"}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap font-mono">{r.checkOut ?? "—"}</td>
                      <td className="py-1.5 px-1 text-center whitespace-nowrap">{r.rawHours > 0 ? `${r.rawHours.toFixed(1)}h` : "—"}</td>
                      <td className={cn(
                        "py-1.5 px-1 text-center whitespace-nowrap font-medium",
                        r.paidHours > 0 && r.paidHours < r.rawHours ? "text-amber-600" : "",
                        r.paidHours > 0 ? "text-emerald-600" : "",
                        r.missingShift && r.rawHours > 0 ? "text-red-500" : ""
                      )}>
                        {r.missingShift && r.rawHours > 0 ? "No shift" : r.paidHours > 0 ? `${r.paidHours.toFixed(1)}h` : "—"}
                      </td>
                      <td className={cn(
                        "py-1.5 pl-3 text-right font-semibold whitespace-nowrap",
                        r.status === "done" ? "text-emerald-600" : r.status === "working" ? "text-amber-600" : "text-zinc-400",
                        r.missingShift ? "text-red-500" : ""
                      )}>
                        {r.missingShift ? "No shift" : r.pay > 0 ? formatCurrency(r.pay) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 pt-3 border-t flex gap-4 text-[10px] text-zinc-400">
              <span><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" /> Done</span>
              <span><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mr-1" /> Working</span>
              <span><span className="w-1.5 h-1.5 rounded-full bg-zinc-300 inline-block mr-1" /> Absent</span>
              <span className="ml-auto">Paid = capped at shift</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
