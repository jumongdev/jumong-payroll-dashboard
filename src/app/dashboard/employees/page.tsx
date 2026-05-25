import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createEmployee, deleteEmployee } from "@/lib/actions/employees"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Users } from "lucide-react"
import Link from "next/link"

export default async function EmployeesPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "admin"
  const userId = session?.user?.id

  const employees = isAdmin
    ? await db.user.findMany({ orderBy: { createdAt: "desc" } })
    : await db.user.findMany({ where: { id: userId } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Employees</h2>
          <p className="text-zinc-500 mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Employee List
          </CardTitle>
          {isAdmin && (
            <Link href="/dashboard/employees/new">
              <Button size="sm">Add Employee</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {emp.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{emp.fullName}</p>
                    <p className="text-sm text-zinc-500">
                      {emp.position || "No position"} &middot; {emp.department || "No department"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-sm text-zinc-500">{emp.email}</p>
                    <p className="text-xs text-zinc-400">ID: {emp.employeeId}</p>
                  </div>
                  <Badge variant={emp.role === "admin" ? "default" : "secondary"}>
                    {emp.role}
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(emp.rate * 160)}</span>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No employees found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
