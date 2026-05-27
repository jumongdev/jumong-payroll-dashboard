"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@/lib/actions/employees"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Phone, MapPin, Calendar, Hash, Shield, Briefcase, Camera, Pencil, X, Check, AlertTriangle } from "lucide-react"

interface UserData {
  id: string
  fullName: string
  email: string
  employeeId: string
  mobile: string | null
  address: string | null
  birthDate: string | null
  designation: string | null
  rate: number
  joinDate: string
  sssNumber: string | null
  pagibigNumber: string | null
  philhealthNumber: string | null
  gender: string | null
  role: string
  profileImage: string | null
}

export default function AccountView({ user }: { user: UserData }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileImage, setProfileImage] = useState(user.profileImage || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function formatDateValue(d: string | null): string {
    if (!d) return ""
    return d.split("T")[0]
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const max = 200
      let w = img.width
      let h = img.height
      if (w > h) { if (w > max) { h = h * max / w; w = max } }
      else { if (h > max) { w = w * max / h; h = max } }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, w, h)
      setProfileImage(canvas.toDataURL("image/jpeg", 0.7))
    }
    img.src = URL.createObjectURL(file)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const data = new FormData(form)
    data.set("profileImage", profileImage)
    data.set("id", user.id)
    await updateProfile(data)
    setEditing(false)
    setSaving(false)
    router.refresh()
  }

  const isProfileComplete = !!(user.mobile && user.address && user.birthDate && user.gender)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Account</h2>
          <p className="text-zinc-500 mt-1">View and edit your personal details</p>
        </div>
        {!editing && (
          <Button size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-1" />
            Edit Profile
          </Button>
        )}
      </div>

      {!isProfileComplete && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Kumpletuhin ang profile</p>
            <p className="text-xs text-amber-700 mt-0.5">Kailangan mong sagutan ang Mobile, Address, Birthday, at Gender bago makapasok sa dashboard.</p>
          </div>
        </div>
      )}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User size={18} />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              {editing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={18} className="text-white" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-600 mt-2 hover:underline"
              >
                Change photo
              </button>
            )}
            <h3 className="text-lg font-semibold mt-2">{user.fullName}</h3>
            <p className="text-sm text-zinc-500">{user.role === "admin" ? "Admin" : user.designation || "Employee"}</p>
          </div>

          {editing ? (
            <form id="profile-form" onSubmit={handleSave} className="space-y-3 pt-4 border-t">
              <InfoRow icon={Hash} label="Employee ID" value={user.employeeId} />
              <InfoRow icon={Mail} label="Email" value={user.email} />

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-500 w-20 shrink-0">Mobile</span>
                </label>
                <Input name="mobile" required defaultValue={user.mobile || ""} placeholder="0917-123-4567" className="mt-1 text-sm h-9" />
                {!user.mobile && !editing && <p className="text-xs text-red-500 mt-0.5">Required</p>}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-500 w-20 shrink-0">Address</span>
                </label>
                <Input name="address" required defaultValue={user.address || ""} placeholder="123 Rizal St., Manila" className="mt-1 text-sm h-9" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-500 w-20 shrink-0">Birthday</span>
                </label>
                <Input name="birthDate" type="date" required defaultValue={formatDateValue(user.birthDate)} className="mt-1 text-sm h-9" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-500 w-20 shrink-0">Gender</span>
                </label>
                <select name="gender" required defaultValue={user.gender || ""} className="mt-1 w-full h-9 rounded-lg border border-zinc-200 px-3 text-sm">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-zinc-700 mb-2">Government IDs</p>
                <div className="space-y-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <Shield size={14} className="text-zinc-400 shrink-0" />
                      <span className="text-zinc-500 w-20 shrink-0">SSS</span>
                    </label>
                    <Input name="sssNumber" defaultValue={user.sssNumber || ""} placeholder="12-3456789-0" className="mt-1 text-sm h-9" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <Shield size={14} className="text-zinc-400 shrink-0" />
                      <span className="text-zinc-500 w-20 shrink-0">Pag-IBIG</span>
                    </label>
                    <Input name="pagibigNumber" defaultValue={user.pagibigNumber || ""} placeholder="1234-5678-9012" className="mt-1 text-sm h-9" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <Shield size={14} className="text-zinc-400 shrink-0" />
                      <span className="text-zinc-500 w-20 shrink-0">PhilHealth</span>
                    </label>
                    <Input name="philhealthNumber" defaultValue={user.philhealthNumber || ""} placeholder="12-345678901-2" className="mt-1 text-sm h-9" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(false); setProfileImage(user.profileImage || "") }}
                  className="flex-1 h-10"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="flex-1 h-10">
                  <Check size={14} className="mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3 pt-4 border-t">
                <InfoRow icon={Hash} label="Employee ID" value={user.employeeId} />
                <InfoRow icon={Mail} label="Email" value={user.email} />
                <InfoRow icon={Phone} label="Mobile" value={user.mobile || <span className="text-red-500">Missing — required</span>} />
                <InfoRow icon={MapPin} label="Address" value={user.address || <span className="text-red-500">Missing — required</span>} />
                <InfoRow icon={Calendar} label="Birthday" value={user.birthDate ? formatDate(user.birthDate) : <span className="text-red-500">Missing — required</span>} />
                <InfoRow icon={Calendar} label="Date Hired" value={formatDate(user.joinDate)} />
                <InfoRow icon={Briefcase} label="Designation" value={user.designation || "N/A"} />
                <InfoRow icon={User} label="Gender" value={user.gender || <span className="text-red-500">Missing — required</span>} />
                <InfoRow icon={Hash} label="Hourly Rate" value={formatCurrency(user.rate)} />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium text-zinc-700">Government IDs <span className="text-zinc-400 text-xs font-normal">(optional)</span></p>
                <InfoRow icon={Shield} label="SSS" value={user.sssNumber || "N/A"} />
                <InfoRow icon={Shield} label="Pag-IBIG" value={user.pagibigNumber || "N/A"} />
                <InfoRow icon={Shield} label="PhilHealth" value={user.philhealthNumber || "N/A"} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} className="text-zinc-400 shrink-0" />
      <span className="text-zinc-500 w-16 lg:w-20 shrink-0 text-xs lg:text-sm">{label}</span>
      <span className="text-zinc-900 truncate text-xs lg:text-sm">{value}</span>
    </div>
  )
}
