"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateSupplier } from "@/lib/actions/suppliers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"

export function EditSupplierButton({ id, name, contact, phone }: {
  id: string
  name: string
  contact: string | null
  phone: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [n, setName] = useState(name)
  const [c, setContact] = useState(contact || "")
  const [p, setPhone] = useState(phone || "")

  async function save() {
    if (!n.trim()) return
    await updateSupplier(id, n.trim(), c.trim() || null, p.trim() || null)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="text-zinc-400 hover:text-emerald-600 mr-1" onClick={() => setOpen(true)} title="Edit">
        <Pencil size={12} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <p className="font-semibold text-sm text-zinc-900 mb-4">Edit Supplier</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Name</label>
                <Input value={n} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Agent</label>
                <Input value={c} onChange={(e) => setContact(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Mobile</label>
                <Input value={p} onChange={(e) => setPhone(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={!n.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
