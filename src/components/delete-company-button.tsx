"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteCompany } from "@/lib/actions/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, AlertTriangle } from "lucide-react"

export default function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirm !== companyName) return
    setDeleting(true)
    await deleteCompany(companyId)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => { setOpen(true); setConfirm("") }}
      >
        <Trash2 size={14} />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Delete {companyName}?</p>
                <p className="text-sm text-zinc-500 mt-1">
                  This will also delete all shifts, schedules, and store images. This cannot be undone.
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-600 mb-1">Type <strong>{companyName}</strong> to confirm:</p>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={companyName}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={confirm !== companyName || deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete Company"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
