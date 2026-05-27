"use client"

import { useRouter } from "next/navigation"
import { toggleCompanySetting } from "@/lib/actions/companies"

export default function CompanySettings({
  companyId,
  earlyInPaid,
  lateOutPaid,
}: {
  companyId: string
  earlyInPaid: boolean
  lateOutPaid: boolean
}) {
  const router = useRouter()

  async function toggle(field: "earlyInPaid" | "lateOutPaid", value: boolean) {
    await toggleCompanySetting(companyId, field, value)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-100">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={earlyInPaid}
          onChange={(e) => toggle("earlyInPaid", e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-emerald-600"
        />
        <span className="text-[10px] text-zinc-600 font-medium">Early in paid</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={lateOutPaid}
          onChange={(e) => toggle("lateOutPaid", e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-emerald-600"
        />
        <span className="text-[10px] text-zinc-600 font-medium">Late out paid</span>
      </label>
    </div>
  )
}
