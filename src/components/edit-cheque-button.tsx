"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateCheque } from "@/lib/actions/cheques"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"

function toDateInputValue(date: Date | null): string {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

export function EditChequeButton({
  id, chequeNo, payee, amount, bank, issueDate, dueDate, voucherNo, notes,
}: {
  id: string
  chequeNo: string
  payee: string
  amount: number
  bank: string
  issueDate: Date
  dueDate: Date | null
  voucherNo: string | null
  notes: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [cn, setCn] = useState(chequeNo)
  const [p, setP] = useState(payee)
  const [a, setA] = useState(String(amount))
  const [b, setB] = useState(bank === "—" ? "" : bank)
  const [idate, setIdate] = useState(toDateInputValue(issueDate))
  const [ddate, setDdate] = useState(toDateInputValue(dueDate))
  const [vn, setVn] = useState(voucherNo || "")
  const [ns, setNs] = useState(notes || "")

  async function save() {
    if (!cn.trim() || !p.trim() || !a.trim() || parseFloat(a) <= 0 || !idate) return
    await updateCheque(id, {
      chequeNo: cn.trim(),
      payee: p.trim(),
      amount: parseFloat(a),
      bank: b.trim() || "—",
      issueDate: idate,
      dueDate: ddate || null,
      voucherNo: vn.trim() || null,
      notes: ns.trim() || null,
    })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="text-zinc-400 hover:text-blue-600" onClick={() => setOpen(true)} title="Edit Cheque">
        <Pencil size={12} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <p className="font-semibold text-sm text-zinc-900 mb-4">Edit Cheque</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Cheque No.</label>
                  <Input value={cn} onChange={(e) => setCn(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Payee</label>
                  <Input value={p} onChange={(e) => setP(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Amount</label>
                  <Input value={a} type="number" step="0.01" onChange={(e) => setA(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Bank</label>
                  <Input value={b} onChange={(e) => setB(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Issue Date</label>
                  <Input value={idate} type="date" onChange={(e) => setIdate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Due Date</label>
                  <Input value={ddate} type="date" onChange={(e) => setDdate(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Voucher/Ref No.</label>
                  <Input value={vn} onChange={(e) => setVn(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Notes</label>
                  <Input value={ns} onChange={(e) => setNs(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={!cn.trim() || !p.trim() || !a.trim() || parseFloat(a) <= 0 || !idate}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
