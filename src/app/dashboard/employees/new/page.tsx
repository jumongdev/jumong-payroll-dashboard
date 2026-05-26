"use client"

import { useState } from "react"
import { createEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/dialog"
import Link from "next/link"

const DESIGNATIONS = ["Driver", "Cashier", "Helper", "Bagger"]

export default function NewEmployeePage() {
  const [result, setResult] = useState<{ email: string; password: string; employeeId: string; fullName: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    const res = await createEmployee(formData)
    setResult(res)
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Employee Created</h2>
            <p className="text-zinc-500">Save these credentials for the employee</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{result.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-800 mb-3">Login Credentials</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Employee ID:</span>
                  <span className="font-mono font-medium">{result.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-medium">{result.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Password:</span>
                  <span className="font-mono font-medium">{result.password}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              The employee can login at <strong>payroll.jumongdev.com/login</strong> using these credentials.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard/employees">
                <Button variant="outline">Back to Employees</Button>
              </Link>
              <Button onClick={() => setResult(null)}>Add Another</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <form action={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name *</label>
                  <Input name="fullName" required placeholder="Juan Dela Cruz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email *</label>
                  <Input name="email" type="email" required placeholder="juan@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
                  <Input name="address" placeholder="123 Rizal St., Manila" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Mobile</label>
                  <Input name="mobile" placeholder="0917-123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Gender</label>
                  <Select name="gender">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Birthday</label>
                  <Input name="birthDate" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Join Date</label>
                  <Input name="joinDate" type="date" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Government IDs</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">SSS Number</label>
                  <Input name="sssNumber" placeholder="12-3456789-0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Pag-IBIG Number</label>
                  <Input name="pagibigNumber" placeholder="1234-5678-9012" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">PhilHealth Number</label>
                  <Input name="philhealthNumber" placeholder="12-345678901-2" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Employment</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Designation</label>
                  <Select name="designation" required>
                    <option value="">Select designation...</option>
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Hourly Rate (PHP)</label>
                  <Input name="rate" type="number" step="0.01" defaultValue="500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                  <Input name="password" type="text" defaultValue="password123" placeholder="Set login password" />
                  <p className="text-xs text-zinc-400 mt-1">Give this to the employee to login</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                  <Select name="role" defaultValue="employee">
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
