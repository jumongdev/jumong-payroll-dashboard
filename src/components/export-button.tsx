"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ExportButton({ action, label }: { action: () => Promise<string>; label: string }) {
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    const csv = await action()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={loading} className="h-9 text-xs">
      <Download size={12} className="mr-1" />
      {loading ? "Exporting..." : label}
    </Button>
  )
}
