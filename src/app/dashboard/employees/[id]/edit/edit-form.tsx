"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/dialog"
import Link from "next/link"
import { Camera } from "lucide-react"

const DESIGNATIONS = ["Driver", "Cashier", "Helper", "Bagger"]

export default function EditEmployeePage({ employee }: {
  employee: {
    id: string
    fullName: string
    email: string
    employeeId: string
    address: string | null
    mobile: string | null
    birthDate: Date | null
    joinDate: Date
    sssNumber: string | null
    pagibigNumber: string | null
    philhealthNumber: string | null
    designation: string | null
    rate: number
    profileImage: string | null
  }
}) {
  const router = useRouter()
  const [photo, setPhoto] = useState(employee.profileImage || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function formatDateValue(d: Date | null): string {
    if (!d) return ""
    return d.toISOString().split("T")[0]
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const max = 200
      let w = img.width, h = img.height
      if (w > h) { if (w > max) { h = h * max / w; w = max } }
      else { if (h > max) { w = w * max / h; h = max } }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      setPhoto(canvas.toDataURL("image/jpeg", 0.7))
    }
    img.src = URL.createObjectURL(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const data = new FormData(form)
    if (photo && photo !== employee.profileImage) {
      data.set("profileImage", photo)
    }
    await updateEmployee(data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Edit Employee</h2>
          <p className="text-zinc-500">{employee.fullName} ({employee.employeeId})</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={employee.id} />

            <div className="flex items-center gap-4 mb-2">
              <div className="relative group">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                    {employee.fullName.charAt(0)}
                  </div>
                )}
                <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-emerald-600 hover:underline">Change photo</button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                  <Input name="fullName" required defaultValue={employee.fullName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                  <Input name="email" type="email" required defaultValue={employee.email} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
                  <Input name="address" defaultValue={employee.address || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Mobile</label>
                  <Input name="mobile" defaultValue={employee.mobile || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Birthday</label>
                  <Input name="birthDate" type="date" defaultValue={formatDateValue(employee.birthDate)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Join Date</label>
                  <Input name="joinDate" type="date" defaultValue={formatDateValue(employee.joinDate)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Government IDs</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">SSS Number</label>
                  <Input name="sssNumber" defaultValue={employee.sssNumber || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Pag-IBIG Number</label>
                  <Input name="pagibigNumber" defaultValue={employee.pagibigNumber || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">PhilHealth Number</label>
                  <Input name="philhealthNumber" defaultValue={employee.philhealthNumber || ""} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3 border-b pb-1">Employment</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Designation</label>
                  <Select name="designation" required defaultValue={employee.designation || ""}>
                    <option value="">Select designation...</option>
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Hourly Rate (PHP)</label>
                  <Input name="rate" type="number" step="0.01" defaultValue={employee.rate} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/dashboard/employees">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving || saved}>{saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
