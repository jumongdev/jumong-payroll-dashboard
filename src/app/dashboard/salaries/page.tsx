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

      <div className="space-y-3">
        {salaries.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{s.user.fullName}</p>
                  <p className="text-sm text-zinc-500">
                    {s.month} {s.year} &middot; ID: {s.user.employeeId}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden lg:grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Gross</p>
                      <p className="font-medium">{formatCurrency(s.grossPay || s.basicSalary)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-400">Deductions</p>
                      <p className="text-xs text-red-600">
                        {s.sssContribution ? `SSS ${formatCurrency(s.sssContribution)} · ` : ""}
                        {s.philhealthContribution ? `PH ${formatCurrency(s.philhealthContribution)} · ` : ""}
                        {s.pagibigContribution ? `Pag-IBIG ${formatCurrency(s.pagibigContribution)} · ` : ""}
                        {s.withholdingTax ? `TIN ${formatCurrency(s.withholdingTax)}` : ""}
                        {s.deductions > 0 ? ` · Other ${formatCurrency(s.deductions)}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Net</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(s.netSalary)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={s.status === "paid" ? "success" : s.status === "pending" ? "warning" : "destructive"}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right lg:hidden">
                    <p className="font-bold text-emerald-600">{formatCurrency(s.netSalary)}</p>
                    <Badge variant={s.status === "paid" ? "success" : s.status === "pending" ? "warning" : "destructive"}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {salaries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-500">
              No salary records found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
