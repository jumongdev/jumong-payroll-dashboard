import { db } from "@/lib/prisma"
import { createSalary } from "@/lib/actions/salaries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/dialog"
import { MONTHS } from "@/lib/utils"
import Link from "next/link"

export default async function NewSalaryPage() {
  const employees = await db.user.findMany({
    select: { id: true, fullName: true, employeeId: true, rate: true },
    orderBy: { fullName: "asc" },
  })

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/salaries">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Add Salary</h2>
          <p className="text-zinc-500">Process payroll for an employee</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSalary} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Employee</label>
              <Select name="userId" required>
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeId})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Month</label>
                <Select name="month" required>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Year</label>
                <Input name="year" type="number" required defaultValue={currentYear} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Basic Salary ($)</label>
                <Input name="basicSalary" type="number" step="0.01" required defaultValue="5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Housing Allowance ($)</label>
                <Input name="housingAllowance" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Transport Allowance ($)</label>
                <Input name="transportAllowance" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Other Allowances ($)</label>
                <Input name="otherAllowances" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Deductions ($)</label>
                <Input name="deductions" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tax ($)</label>
                <Input name="tax" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                <Select name="status" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Date</label>
                <Input name="paymentDate" type="date" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <Input name="notes" placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/salaries">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Save Salary</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
