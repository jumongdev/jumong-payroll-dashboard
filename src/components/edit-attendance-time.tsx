"use client"

import { useState } from "react"
import { updateAttendanceTime } from "@/lib/actions/attendance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EditAttendanceTime({ recordId, currentIn, currentOut }: {
  recordId: string
  currentIn: Date | string | null
  currentOut: Date | string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checkIn, setCheckIn] = useState(currentIn ? toLocalDatetime(new Date(currentIn)) : "")
  const [checkOut, setCheckOut] = useState(currentOut ? toLocalDatetime(new Date(currentOut)) : "")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const cin = checkIn ? new Date(checkIn + ":00+08:00").toISOString() : undefined
    const cout = checkOut ? new Date(checkOut + ":00+08:00").toISOString() : undefined
    await updateAttendanceTime(recordId, cin, cout)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(true)} title="Edit times">
        <Pencil size={12} />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-500">In:</span>
        <Input
          type="datetime-local"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="h-7 text-xs w-44"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-500">Out:</span>
        <Input
          type="datetime-local"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="h-7 text-xs w-44"
        />
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={save} disabled={saving}>
        <Check size={14} />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setOpen(false)}>
        <X size={14} />
      </Button>
    </div>
  )
}

function toLocalDatetime(d: Date): string {
  const iso = new Date(d.getTime() + 8 * 3600000).toISOString()
  return iso.slice(0, 16)
}
