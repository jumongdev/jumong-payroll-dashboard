import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { generatePayslip } from "@/lib/actions/payslips"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText, Printer } from "lucide-react"
import Link from "next/link"

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
              <div className="flex flex-col gap-3">
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
                    <Link href={`/dashboard/payslips/${p.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
                        <Printer size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
                {p.salary.sssContribution > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-t pt-3">
                    <div>
                      <span className="text-zinc-500">Gross Pay:</span>
                      <span className="ml-1 font-medium">{formatCurrency(p.salary.grossPay || p.salary.basicSalary)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">SSS:</span>
                      <span className="ml-1 text-red-600">{formatCurrency(p.salary.sssContribution)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">PhilHealth:</span>
                      <span className="ml-1 text-red-600">{formatCurrency(p.salary.philhealthContribution)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Pag-IBIG:</span>
                      <span className="ml-1 text-red-600">{formatCurrency(p.salary.pagibigContribution)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Withholding Tax:</span>
                      <span className="ml-1 text-red-600">{formatCurrency(p.salary.withholdingTax)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Net Pay:</span>
                      <span className="ml-1 font-bold text-emerald-600">{formatCurrency(p.salary.netSalary)}</span>
                    </div>
                  </div>
                )}
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
