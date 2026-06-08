"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintSlipsButton({ entries, weekLabel }: {
  entries: any[]
  weekLabel: string
}) {
  function printSlips() {
    const slipEls = entries.map((e) => {
      const debt = e.deductions > 0 ? e.deductions : 0
      const net = Math.max(0, e.grossPay - debt)
      return `
<div style="page-break-after:always;width:74mm;padding:3mm 0;font-family:'Courier New',monospace;font-size:10px;line-height:1.3;">
  <div style="text-align:center;border-bottom:1px solid #000;padding-bottom:3px;">
    <div style="font-size:13px;font-weight:bold;">PAY SLIP</div>
    <div style="font-size:9px;">${weekLabel}</div>
  </div>
  <div style="margin:4px 0;font-size:11px;font-weight:bold;">${e.user.fullName}</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:2px 0;">Rate</td><td style="padding:2px 0;text-align:right;">₱${e.rate}/hr</td></tr>
    <tr><td style="padding:2px 0;">Hours</td><td style="padding:2px 0;text-align:right;">${e.totalHours}h</td></tr>
    <tr><td style="padding:2px 0;">Gross</td><td style="padding:2px 0;text-align:right;">₱${e.grossPay.toFixed(2)}</td></tr>
    ${debt > 0 ? `<tr><td style="padding:2px 0;">Deductions</td><td style="padding:2px 0;text-align:right;">-₱${debt.toFixed(2)}</td></tr>` : ''}
  </table>
  <div style="border-top:2px solid #000;margin-top:4px;padding-top:4px;text-align:center;font-size:16px;font-weight:bold;">
    ₱${net.toFixed(2)}
  </div>
</div>`
    }).join("")

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
<html><head><title>Pay Slips</title>
<meta charset="utf-8">
<style>
  @page { margin: 0; size: 80mm 60mm; }
  body { margin: 0; padding: 2mm; }
  @media print { body { margin: 0; padding: 2mm; } }
</style>
</head><body>${slipEls}</body></html>
`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  return (
    <Button variant="outline" size="sm" onClick={printSlips} className="h-9 text-xs">
      <Printer size={12} className="mr-1" />
      Print Slips
    </Button>
  )
}
