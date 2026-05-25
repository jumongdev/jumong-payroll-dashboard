import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import StatsCards from "@/components/stats-cards"
import { Users, DollarSign, Clock, FileText, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id

  const [totalEmployees, totalSalaries, recentAttendance, totalPayslips, monthlyPayroll, recentSalaries] =
    await Promise.all([
      db.user.count({ where: isAdmin ? {} : { id: userId } }),
      db.salary.count({ where: isAdmin ? {} : { userId: userId! } }),
      db.attendance.count({ where: isAdmin ? {} : { userId: userId! } }),
      db.payslip.count({ where: isAdmin ? {} : { userId: userId! } }),
      db.salary.aggregate({
        _sum: { netSalary: true },
        where: { year: new Date().getFullYear(), status: "paid" },
      }),
      db.salary.findMany({
        where: isAdmin ? {} : { userId: userId! },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      trend: "Active workforce",
    },
    {
      title: "Monthly Payroll",
      value: formatCurrency(monthlyPayroll._sum.netSalary || 0),
      icon: DollarSign,
      description: `Year ${new Date().getFullYear()}`,
    },
    {
      title: "Attendance Records",
      value: recentAttendance,
      icon: Clock,
      trend: "Current period",
    },
    {
      title: "Payslips Issued",
      value: totalPayslips,
      icon: FileText,
      description: "Generated payslips",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-zinc-500 mt-1">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Recent Salaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSalaries.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No salary records found.</p>
            ) : (
              <div className="space-y-3">
                {recentSalaries.map((s) => (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.user.fullName}</p>
                      <p className="text-xs text-zinc-500">{s.month} {s.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(s.netSalary)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${s.status === "paid" ? "bg-emerald-100 text-emerald-700" : s.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && <AdminPayrollChart />}
      </div>
    </div>
  )
}

async function AdminPayrollChart() {
  const currentYear = new Date().getFullYear()
  const salaries = await db.salary.findMany({
    where: { year: currentYear, status: "paid" },
    select: { netSalary: true, month: true },
  })

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const data = months.map((month) => ({
    month: month.substring(0, 3),
    total: salaries.filter((s) => s.month === month).reduce((sum, s) => sum + s.netSalary, 0),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={18} />
          Payroll Trend {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.month} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-8">{d.month}</span>
              <div className="flex-1 h-5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min((d.total / (Math.max(...data.map((x) => x.total)) || 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium w-20 text-right">{formatCurrency(d.total)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
