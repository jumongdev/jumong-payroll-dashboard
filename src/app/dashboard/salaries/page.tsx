import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSalary, updateSalaryStatus, deleteSalary } from "@/lib/actions/salaries"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DollarSign } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Salaries</h2>
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

      <div className="space-y-3">
        {salaries.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.user.fullName}</p>
                  <p className="text-sm text-zinc-500">
                    {s.month} {s.year} &middot; ID: {s.user.employeeId}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Base</p>
                      <p className="font-medium">{formatCurrency(s.basicSalary)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Allowances</p>
                      <p className="font-medium">{formatCurrency(s.housingAllowance + s.transportAllowance + s.otherAllowances)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Deductions</p>
                      <p className="font-medium text-red-600">{formatCurrency(s.deductions + s.tax)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Net</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(s.netSalary)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 md:hidden">{formatCurrency(s.netSalary)}</p>
                    <Badge
                      variant={
                        s.status === "paid" ? "success" : s.status === "pending" ? "warning" : "destructive"
                      }
                    >
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
