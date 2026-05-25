import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { generatePayslip } from "@/lib/actions/payslips"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

export default async function PayslipsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id

  const payslips = await db.payslip.findMany({
    where: isAdmin ? {} : { userId: userId! },
    include: {
      user: { select: { fullName: true, employeeId: true } },
      salary: true,
    },
    orderBy: { issuedAt: "desc" },
  })

  const unpaidSalaries = isAdmin
    ? []
    : await db.salary.findMany({
        where: { userId: userId!, status: "paid", payslips: { none: {} } },
        take: 10,
      })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Payslips</h2>
        <p className="text-zinc-500 mt-1">
          {payslips.length} payslip{payslips.length !== 1 ? "s" : ""} issued
        </p>
      </div>

      {!isAdmin && unpaidSalaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unpaidSalaries.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.month} {s.year}</p>
                    <p className="text-sm text-emerald-600 font-medium">{formatCurrency(s.netSalary)}</p>
                  </div>
                  <form action={async () => {
                    "use server"
                    await generatePayslip(s.id, userId!)
                  }}>
                    <Button size="sm">Generate</Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {payslips.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-emerald-600" />
                  <div>
                    <p className="font-medium">{p.user.fullName}</p>
                    <p className="text-sm text-zinc-500">
                      {p.salary.month} {p.salary.year} &middot; ID: {p.user.employeeId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(p.salary.netSalary)}</p>
                    <p className="text-xs text-zinc-500">Issued: {formatDate(p.issuedAt)}</p>
                  </div>
                  <Badge variant="success">Issued</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {payslips.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-500">
              No payslips generated yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
