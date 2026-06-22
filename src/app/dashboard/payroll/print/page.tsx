import { db } from "@/lib/prisma"
import { formatCurrency, getPhilippineWeekRange } from "@/lib/utils"

export default async function PrintPayroll({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const params = await searchParams
  const weekOffset = parseInt(params.week || "0") || 0

  const { monday: currentMonday, sunday: currentSunday } = getPhilippineWeekRange()
  const weekStart = new Date(currentMonday)
  weekStart.setUTCDate(currentMonday.getUTCDate() + weekOffset * 7)
  const weekEnd = new Date(currentSunday)
  weekEnd.setUTCDate(currentSunday.getUTCDate() + weekOffset * 7)
  const weekLabel = `${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" }).format(weekStart)} - ${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric" }).format(weekEnd)}`

  const period = await db.payrollPeriod.findFirst({
    where: { weekStart, weekEnd },
  })

  let entries: any[] = []
  if (period) {
    entries = await db.payrollEntry.findMany({
      where: { payrollPeriodId: period.id },
      include: { user: { select: { fullName: true, employeeId: true, designation: true } } },
      orderBy: { createdAt: "asc" },
    })
  }

  const totalGross = entries.reduce((s, e) => s + e.grossPay, 0)
  const totalDeductions = entries.reduce((s, e) => s + e.deductions, 0)
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0)
  const paidCount = entries.filter((e) => e.status === "paid").length

  return (
    <html>
      <head>
        <title>Payroll Summary - {weekLabel}</title>
        <style>{`
          @page { margin: 0; size: 80mm 70mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 9px; color: #000; padding: 3mm; width: 80mm; }
          h1 { font-size: 12px; text-align: center; margin-bottom: 2px; }
          .subtitle { text-align: center; font-size: 9px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; }
          th { border-bottom: 1px solid #000; padding: 3px 2px; text-align: left; font-size: 8px; }
          td { padding: 2px; }
          .amt { text-align: right; }
          .total-row td { border-top: 1px solid #000; font-weight: bold; padding-top: 3px; }
          .paid { color: #fff; background: #000; padding: 0 4px; font-size: 8px; }
          .pending { border: 1px solid #000; padding: 0 4px; font-size: 8px; }
          .footer { text-align: center; margin-top: 10px; font-size: 7px; border-top: 1px solid #ccc; padding-top: 6px; }
        `}</style>
      </head>
      <body>
        <h1>JumongDev Payroll</h1>
        <div className="subtitle">Week: {weekLabel}</div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Hours</th>
              <th className="amt">Rate</th>
              <th className="amt">Gross</th>
              <th className="amt">Debt</th>
              <th className="amt">Net</th>
              <th style={{textAlign:"center"}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.user.fullName}</td>
                <td>{e.totalHours}h</td>
                <td className="amt">{formatCurrency(e.rate)}</td>
                <td className="amt">{formatCurrency(e.grossPay)}</td>
                <td className="amt">{e.deductions > 0 ? formatCurrency(e.deductions) : "—"}</td>
                <td className="amt">{formatCurrency(e.netPay)}</td>
                <td style={{textAlign:"center"}}>
                  <span className={e.status === "paid" ? "paid" : "pending"}>
                    {e.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={4}>TOTAL ({entries.length} employees, {paidCount} paid)</td>
              <td className="amt">{formatCurrency(totalGross)}</td>
              <td className="amt">{formatCurrency(totalDeductions)}</td>
              <td className="amt">{formatCurrency(totalNet)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div className="footer">
          <p>JumongDev Payroll System &middot; Printed {new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", dateStyle: "full", timeStyle: "short" }).format(new Date())}</p>
        </div>

        <script dangerouslySetInnerHTML={{ __html: "window.onload = function() { setTimeout(function() { window.print() }, 300) }" }} />
      </body>
    </html>
  )
}
