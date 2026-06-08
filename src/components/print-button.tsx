"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 text-xs">
      <Printer size={12} className="mr-1" />
      Print Summary
    </Button>
  )
}
