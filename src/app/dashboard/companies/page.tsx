import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCompany, deleteCompany } from "@/lib/actions/companies"
import { createShift, deleteShift } from "@/lib/actions/shifts"
import { Building, Trash2, MapPin, Plus, Clock } from "lucide-react"
import StorePinButton from "@/components/store-pin-button"
import QrUploadButton from "@/components/qr-upload-button"

export default async function CompaniesPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard/account")

  const companies = await db.company.findMany({
    include: { shifts: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Companies</h2>
          <p className="text-zinc-500 mt-1">{companies.length} compan{companies.length !== 1 ? "ies" : "y"}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building size={18} />
            Add Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCompany} className="flex flex-col sm:flex-row gap-3">
            <Input name="name" required placeholder="Company name" className="sm:flex-1 h-10" />
            <Input name="address" placeholder="Address" className="sm:flex-1 h-10" />
            <Button type="submit" size="sm" className="h-10 shrink-0">
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {companies.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{c.name}</p>
                  {c.address && <p className="text-sm text-zinc-500">{c.address}</p>}
                  {c.latitude && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {c.latitude.toFixed(5)}, {c.longitude?.toFixed(5)}
                    </p>
                  )}
                  {!c.latitude && (
                    <p className="text-xs text-amber-600 mt-1">No store pin set</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <StorePinButton companyId={c.id} companyName={c.name} />
                  <QrUploadButton companyId={c.id} currentQr={c.qrCode} />
                  <form action={async () => { "use server"; await deleteCompany(c.id) }}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 size={14} />
                    </Button>
                  </form>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-start gap-3">
                  {c.qrCode && (
                    <img src={c.qrCode} alt="QR Code" className="w-16 h-16 rounded border" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-700 mb-2 flex items-center gap-1">
                      <Clock size={12} /> Shifts
                    </p>
                    {c.shifts.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1 text-sm">
                        <span>
                          <span className="font-medium text-zinc-700">{s.name}</span>
                          <span className="text-zinc-500 ml-2">{s.startTime} - {s.endTime}</span>
                        </span>
                        <form action={async () => { "use server"; await deleteShift(s.id) }}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600">
                            <Trash2 size={10} />
                          </Button>
                        </form>
                      </div>
                    ))}
                    <form action={createShift} className="flex gap-2 mt-2">
                      <input type="hidden" name="companyId" value={c.id} />
                      <Input name="name" required placeholder="Shift name" className="h-8 text-xs flex-1" />
                      <input name="startTime" type="time" required defaultValue="06:30" className="h-8 rounded-lg border border-zinc-200 px-2 text-xs w-28" />
                      <input name="endTime" type="time" required defaultValue="18:30" className="h-8 rounded-lg border border-zinc-200 px-2 text-xs w-28" />
                      <Button type="submit" size="sm" className="h-8 text-xs shrink-0">
                        <Plus size={12} className="mr-0.5" /> Add
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {companies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-500">No companies added yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
