"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { payEmployee } from "@/lib/actions/payroll"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function PayButton({ entryId, periodId, grossPay, totalDebt }: {
  entryId: string
  periodId: string
  grossPay: number
  totalDebt: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deduction, setDeduction] = useState(totalDebt)
  const [paying, setPaying] = useState(false)

  const maxDeduct = Math.min(totalDebt, grossPay)
  const netAfterDeduct = grossPay - deduction

  async function doPay() {
    setPaying(true)
    await payEmployee(entryId, periodId, deduction)
    setPaying(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
        <CheckCircle size={12} className="mr-1" /> Pay
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <p className="font-semibold text-zinc-900">Pay Employee</p>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-zinc-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Gross Pay</span>
                <span className="font-medium">{formatCurrency(grossPay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Debt</span>
                <span className="text-red-600 font-medium">{formatCurrency(totalDebt)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Deduct from salary
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={maxDeduct}
                  value={deduction}
                  onChange={(e) => setDeduction(parseFloat(e.target.value) || 0)}
                  className="h-10 text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Max deductible: {formatCurrency(maxDeduct)}
                </p>
              </div>
              <div className="flex justify-between text-sm font-semibold py-2 border-t">
                <span>Net Pay</span>
                <span className={netAfterDeduct >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {formatCurrency(netAfterDeduct)}
                </span>
              </div>
              <Button onClick={doPay} disabled={paying || deduction < 0 || deduction > maxDeduct} className="w-full h-10">
                {paying ? "Processing..." : `Pay ${formatCurrency(netAfterDeduct)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
