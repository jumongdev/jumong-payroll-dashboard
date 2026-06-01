import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DollarSign, TrendingDown } from "lucide-react"
import Link from "next/link"

export default async function SalariesPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id

  const salaries = await db.salary.findMany({
    where: isAdmin ? {} : { userId: userId! },
    include: { user: { select: { fullName: true, employeeId: true } } },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  })

  const total = salaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.netSalary, 0)

  const debts = !isAdmin
    ? await db.employeeDebt.findMany({ where: { userId: userId! }, orderBy: { date: "desc" } })
    : []
  const activeDebts = debts.filter((d) => d.remaining > 0)
  const totalDebt = activeDebts.reduce((s, d) => s + d.remaining, 0)

  const debtTrail = !isAdmin
    ? await db.debtTransaction.findMany({
        where: { debt: { userId: userId! } },
        include: { debt: { select: { type: true, description: true, amount: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Salary</h2>
          <p className="text-zinc-500 mt-1">
            Total paid: {formatCurrency(total)} &middot; {salaries.length} records
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/salaries/new">
            <Button size="sm">Add Salary</Button>
          </Link>
        )}
      </div>

      {!isAdmin && debtTrail.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown size={16} className="text-red-500" />
              Debt Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalDebt > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDebt)}</p>
                <p className="text-xs text-red-500">Outstanding Balance</p>
              </div>
            )}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
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
                      {t.source || ""}{t.notes ? ` (${t.notes})` : ""}
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

      <Card className="overflow-hidden">
        {salaries.length === 0 ? (
          <CardContent className="p-8 text-center text-zinc-500">
            No salary records found.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left py-3 pl-5 pr-2 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    {isAdmin ? "Employee" : "Period"}
                  </th>
                  <th className="text-right py-3 px-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">Gross</th>
                  <th className="text-left py-3 px-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Deductions</th>
                  <th className="text-right py-3 px-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">Net</th>
                  <th className="text-center py-3 pr-5 pl-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 pl-5 pr-2">
                      <p className="font-medium text-zinc-900">{isAdmin ? s.user.fullName : `${s.month} ${s.year}`}</p>
                      <p className="text-xs text-zinc-400">
                        {isAdmin ? `${s.month} ${s.year} · ${s.user.employeeId}` : `ID: ${s.user.employeeId}`}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className="font-medium text-zinc-700">{formatCurrency(s.grossPay || s.basicSalary)}</span>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="text-xs text-zinc-500 space-y-0.5">
                        {s.sssContribution > 0 && <p>SSS {formatCurrency(s.sssContribution)}</p>}
                        {s.philhealthContribution > 0 && <p>PhilHealth {formatCurrency(s.philhealthContribution)}</p>}
                        {s.pagibigContribution > 0 && <p>Pag-IBIG {formatCurrency(s.pagibigContribution)}</p>}
                        {s.withholdingTax > 0 && <p>Tax {formatCurrency(s.withholdingTax)}</p>}
                        {s.deductions > 0 && <p className="text-red-500">Other {formatCurrency(s.deductions)}</p>}
                        {s.sssContribution <= 0 && s.philhealthContribution <= 0 && s.pagibigContribution <= 0 && s.withholdingTax <= 0 && s.deductions <= 0 && (
                          <span className="text-zinc-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className="font-bold text-emerald-600">{formatCurrency(s.netSalary)}</span>
                    </td>
                    <td className="py-3 pr-5 pl-3 text-center">
                      <Badge variant={s.status === "paid" ? "success" : s.status === "pending" ? "warning" : "destructive"}>
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
