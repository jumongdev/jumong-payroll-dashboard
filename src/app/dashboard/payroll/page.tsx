import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/table"
import { addDebt, deleteDebt, recomputePayroll } from "@/lib/actions/payroll"
import PayButton from "@/components/pay-button"
import ExportButton from "@/components/export-button"
import PrintButton from "@/components/print-button"
import { exportPayrollCSV, exportDebtsCSV } from "@/lib/actions/export"
import { formatCurrency, formatDate, computePaidHours, getPhilippineWeekRange } from "@/lib/utils"
import { DollarSign, Clock, ChevronLeft, ChevronRight, Printer } from "lucide-react"

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard/account")

  const params = await searchParams
  const weekOffset = parseInt(params.week || "0") || 0

  const { monday: currentMonday, sunday: currentSunday } = getPhilippineWeekRange()
  const weekStart = new Date(currentMonday)
  weekStart.setUTCDate(currentMonday.getUTCDate() + weekOffset * 7)
  const weekEnd = new Date(currentSunday)
  weekEnd.setUTCDate(currentSunday.getUTCDate() + weekOffset * 7)
  const weekLabel = `${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" }).format(weekStart)} - ${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" }).format(weekEnd)}`

  let period = await db.payrollPeriod.findFirst({
    where: { weekStart, weekEnd },
  })

  let entries: any[] = []

  if (period) {
    entries = await db.payrollEntry.findMany({
      where: { payrollPeriodId: period.id },
      include: { user: { select: { fullName: true, employeeId: true, designation: true } } },
      orderBy: { createdAt: "asc" },
    })
  } else {
    period = await db.payrollPeriod.create({ data: { weekStart, weekEnd } })

    const employees = await db.user.findMany({
      where: { role: "employee" },
      select: { id: true, rate: true },
    })

    const allAttendances = await db.attendance.findMany({
      where: {
        userId: { in: employees.map((e) => e.id) },
        date: { gte: weekStart, lte: weekEnd },
        checkIn: { not: null },
        checkOut: { not: null },
        status: { not: "absent" },
      },
    })

    const allSchedules = await db.schedule.findMany({
      where: {
        userId: { in: employees.map((e) => e.id) },
        date: { gte: weekStart, lte: weekEnd },
      },
      include: { shift: { select: { startTime: true, endTime: true } }, company: { select: { earlyInPaid: true, lateOutPaid: true } } },
    })

    const debts = await db.employeeDebt.findMany({
      where: { userId: { in: employees.map((e) => e.id) }, remaining: { gt: 0 } },
    })

    for (const emp of employees) {
      const empAttendances = allAttendances.filter((a) => a.userId === emp.id)
      const empSchedules = allSchedules.filter((s) => s.userId === emp.id)
      const totalHours = empAttendances.reduce((sum, a) => {
        const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(a.date)
        const sched = empSchedules.find(
          (s) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(s.date) === dateStr
        )
        if (sched?.shift?.endTime) {
          return sum + computePaidHours(a.checkIn!, a.checkOut!, sched.shift.startTime, sched.shift.endTime, dateStr, sched.company.earlyInPaid, sched.company.lateOutPaid)
        }
        const diff = (a.checkOut!.getTime() - a.checkIn!.getTime()) / 3600000
        return sum + diff
      }, 0)

      const empDebts = debts.filter((d) => d.userId === emp.id)
      const totalDebt = empDebts.reduce((sum, d) => sum + d.remaining, 0)

      if (totalHours > 0 || totalDebt > 0) {
        const grossPay = Math.round(totalHours * (emp.rate || 0) * 100) / 100
        const netPay = Math.round(grossPay * 100) / 100

        await db.payrollEntry.create({
          data: {
            payrollPeriodId: period.id,
            userId: emp.id,
            totalHours: Math.round(totalHours * 100) / 100,
            rate: emp.rate || 0,
            grossPay,
            deductions: totalDebt,
            netPay,
          },
        })
      }
    }

    revalidatePath("/dashboard/payroll")
  }

  const [allPeriods, debts, employees, debtHistory] = await Promise.all([
    db.payrollPeriod.findMany({
      include: { entries: { select: { netPay: true, status: true } } },
      orderBy: { weekStart: "desc" },
      take: 5,
    }),
    db.employeeDebt.findMany({
      where: { remaining: { gt: 0 } },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "employee" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    db.employeeDebt.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ])

  const totalToPay = entries.filter((e) => e.status === "pending").reduce((s, e) => s + e.netPay, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Payroll</h2>
          <p className="text-zinc-500 mt-1 flex items-center gap-1 flex-wrap">
            <a href={`/dashboard/payroll?week=${weekOffset - 1}`} className="hover:text-zinc-700">
              <ChevronLeft size={14} />
            </a>
            Week: {weekLabel}
            <a href={`/dashboard/payroll?week=${weekOffset + 1}`} className="hover:text-zinc-700">
              <ChevronRight size={14} />
            </a>
            &middot; {entries.length} employees &middot; Pending: {formatCurrency(totalToPay)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <ExportButton action={exportPayrollCSV} label="Export Payroll" />
          <ExportButton action={exportDebtsCSV} label="Export Debts" />
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 80mm; }
          .no-print { display: none !important; }
          .print-area { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; }
          .print-area .p-3 { padding: 4px 0; }
          .print-area .border { border-bottom: 1px dashed #000; }
          .print-area .rounded-lg { border: none; }
          .print-area .bg-white { background: none; }
          .print-area .flex { display: flex; }
          .print-area .items-center { align-items: center; }
          .print-area .justify-between { justify-content: space-between; }
          .print-area .gap-3 { gap: 6px; }
          .print-area .text-sm { font-size: 11px; }
          .print-area .text-xs { font-size: 10px; }
          .print-area .min-w-0 { min-width: 0; }
          .print-area .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
          .print-area .font-medium { font-weight: bold; }
          .print-area .font-bold { font-weight: bold; }
          .print-area .text-right { text-align: right; }
          .print-area .text-emerald-600 { color: #000; }
          .print-area .text-red-500 { color: #000; }
          .print-area .w-8, .print-area .h-8, .print-area .rounded-full, .print-area .shrink-0 { display: none; }
          .print-area .space-y-2 > * + * { margin-top: 3px; }
          .print-area .hidden { display: block !important; }
          .print-header { text-align: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #000; }
          .print-header h2 { font-size: 14px; font-weight: bold; margin: 0; letter-spacing: 1px; }
          .print-header p { font-size: 10px; margin: 3px 0 0; }
          .print-only { display: block; }
          @page { margin: 3mm; size: 80mm auto; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="grid gap-6 md:grid-cols-2 no-print">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign size={16} />
              Add Debt / Deduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addDebt} className="flex flex-col gap-2">
              <select name="userId" required className="h-9 rounded-lg border border-zinc-200 px-2 text-sm">
                <option value="">Select employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input name="amount" type="number" step="0.01" required placeholder="Amount" className="flex-1 h-9 text-sm" />
                <select name="type" required className="h-9 rounded-lg border border-zinc-200 px-2 text-sm w-36">
                  <option value="cash_advance">Cash Advance</option>
                  <option value="damage">Damage</option>
                  <option value="store_negative">Store Negative</option>
                </select>
                <Button type="submit" size="sm" className="h-9 shrink-0">Add</Button>
              </div>
              <Input name="description" placeholder="Description (optional)" className="h-9 text-sm" />
            </form>
          </CardContent>
        </Card>

        {debts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Active Debts ({debts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {debts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <p className="font-medium">{d.user.fullName}</p>
                      <p className="text-xs text-zinc-500">
                        {d.type.replace("_", " ")} · {d.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-medium">{formatCurrency(d.remaining || d.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {debtHistory.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Debt History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-zinc-500">
                    <th className="text-left py-1.5 pr-2 font-medium">Date</th>
                    <th className="text-left py-1.5 px-2 font-medium">Employee</th>
                    <th className="text-left py-1.5 px-2 font-medium">Type</th>
                    <th className="text-left py-1.5 px-2 font-medium">Description</th>
                    <th className="text-right py-1.5 px-2 font-medium">Amount</th>
                    <th className="text-right py-1.5 px-2 font-medium">Remaining</th>
                    <th className="text-center py-1.5 pl-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {debtHistory.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 text-zinc-500">{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="py-1.5 px-2 font-medium">{d.user.fullName}</td>
                      <td className="py-1.5 px-2 capitalize">{d.type.replace("_", " ")}</td>
                      <td className="py-1.5 px-2 text-zinc-500 max-w-32 truncate">{d.description || "—"}</td>
                      <td className="py-1.5 px-2 text-right text-red-600 font-medium">{formatCurrency(d.amount)}</td>
                      <td className="py-1.5 px-2 text-right">{d.remaining > 0 ? formatCurrency(d.remaining) : <span className="text-emerald-600">₱0</span>}</td>
                      <td className="py-1.5 pl-2 text-center">
                        <Badge variant={d.deducted ? "success" : d.remaining > 0 ? "warning" : "success"}>
                          {d.deducted ? "Paid" : d.remaining > 0 ? "Active" : "Cleared"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="print-area">
        <div className="print-header">
          <h2>PAYROLL SUMMARY</h2>
          <p>{weekLabel}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign size={16} />
              Pay Employees
              {period && entries.some((e: any) => e.status === "pending") && (
                <form action={async () => { "use server"; await recomputePayroll(period.id) }}>
                  <Button type="submit" variant="outline" size="sm" className="h-7 text-xs ml-auto no-print">
                    Recompute
                  </Button>
                </form>
              )}
            </CardTitle>
          </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No hours or debts recorded this week.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                      {e.user.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{e.user.fullName}</p>
                      <p className="text-xs text-zinc-500">
                        {e.user.designation || "Employee"} &middot; {e.totalHours}h
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-zinc-500">
                        Gross: {formatCurrency(e.grossPay)}
                        {e.deductions > 0 && <span className="text-red-500"> · Debt: {formatCurrency(e.deductions)}</span>}
                      </p>
                      <p className="font-bold text-emerald-600">{formatCurrency(e.netPay)}</p>
                    </div>
                    <div className="sm:hidden text-right">
                      <p className="font-bold text-emerald-600 text-sm">{formatCurrency(e.netPay)}</p>
                    </div>
                    {e.status === "paid" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <PayButton
                        entryId={e.id}
                        periodId={period.id}
                        grossPay={e.grossPay}
                        totalDebt={debts.filter((d) => d.userId === e.userId).reduce((s, d) => s + d.remaining, 0)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="print-only" style={{marginTop: 8, paddingTop: 6, borderTop: '1px solid #000', fontSize: 11, fontWeight: 'bold'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Total ({entries.length} employees)</span>
              <span>
                Gross: {formatCurrency(entries.reduce((s: number, e: any) => s + e.grossPay, 0))} |
                Net: {formatCurrency(entries.reduce((s: number, e: any) => s + e.netPay, 0))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {allPeriods.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={16} />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allPeriods.map((p) => {
                const paid = p.entries.filter((e) => e.status === "paid")
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(p.weekStart)} - {formatDate(new Date(new Date(p.weekStart).getTime() + 6 * 86400000))}
                      </p>
                      <p className="text-xs text-zinc-500">{p.entries.length} employees</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium">
                        {paid.length === p.entries.length && p.entries.length > 0 ? (
                          <span className="text-emerald-600">{formatCurrency(paid.reduce((s, e) => s + e.netPay, 0))} Paid</span>
                        ) : (
                          <span className="text-amber-600">Open</span>
                        )}
                      </p>
                      <Badge variant={paid.length === p.entries.length && p.entries.length > 0 ? "success" : "warning"}>
                        {paid.length === p.entries.length && p.entries.length > 0 ? "Paid" : "Open"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
