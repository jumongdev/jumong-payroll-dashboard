"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteSupplier } from "@/lib/actions/suppliers"
import { deleteBankAccount } from "@/lib/actions/bank-accounts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, AlertTriangle } from "lucide-react"

export function DeleteSupplierButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")

  async function doDelete() {
    if (confirm.trim().toLowerCase() !== name.trim().toLowerCase()) return
    await deleteSupplier(id)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="text-zinc-400 hover:text-red-500" onClick={() => setOpen(true)}>
        <X size={12} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={18} />
              <p className="font-semibold text-sm">Delete Supplier</p>
            </div>
            <p className="text-sm text-zinc-600 mb-1">
              Type <strong>{name}</strong> to confirm:
            </p>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={`Type "${name}" to delete`}
              className="h-9 text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); setConfirm("") }}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={confirm.trim().toLowerCase() !== name.trim().toLowerCase()}
                onClick={doDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function DeleteBankAccountButton({ id, bank, accountNumber }: { id: string; bank: string; accountNumber: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const label = `${bank} ${accountNumber}`

  async function doDelete() {
    if (confirm.trim().toLowerCase() !== label.trim().toLowerCase()) return
    await deleteBankAccount(id)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="text-zinc-400 hover:text-red-500" onClick={() => setOpen(true)}>
        <X size={12} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={18} />
              <p className="font-semibold text-sm">Delete Bank Account</p>
            </div>
            <p className="text-sm text-zinc-600 mb-1">
              Type <strong>{label}</strong> to confirm:
            </p>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={`Type "${label}" to delete`}
              className="h-9 text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); setConfirm("") }}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={confirm.trim().toLowerCase() !== label.trim().toLowerCase()}
                onClick={doDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
