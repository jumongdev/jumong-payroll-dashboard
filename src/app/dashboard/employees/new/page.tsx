import { createEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Add Employee</h2>
          <p className="text-zinc-500">Create a new employee record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEmployee} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <Input name="fullName" required placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Employee ID</label>
                <Input name="employeeId" required placeholder="EMP001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <Input name="email" type="email" required placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
                <Input name="phone" placeholder="555-0101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Position</label>
                <Input name="position" placeholder="Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
                <Input name="department" placeholder="Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Hourly Rate ($)</label>
                <Input name="rate" type="number" step="0.01" defaultValue="15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Join Date</label>
                <Input name="joinDate" type="date" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/employees">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Save Employee</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
