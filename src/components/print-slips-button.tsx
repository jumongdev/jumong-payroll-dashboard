"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintSlipsButton({ entries, weekLabel }: {
  entries: any[]
  weekLabel: string
}) {
  function printSlips() {
    const slipEls = entries.map((e, i) => {
      const debt = e.deductions > 0 ? e.deductions : 0
      const net = e.grossPay - debt
      return `
        <div style="width: 80mm; padding: 0; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.5; ${i > 0 ? 'page-break-before: always;' : ''}">
          <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
            <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">PAY SLIP</div>
            <div style="font-size: 10px;">${weekLabel}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 2px 0;"><strong>Employee:</strong></td><td style="padding: 2px 0; text-align: right;">${e.user.fullName}</td></tr>
            <tr><td style="padding: 2px 0;"><strong>Designation:</strong></td><td style="padding: 2px 0; text-align: right;">${e.user.designation || "Employee"}</td></tr>
            <tr><td style="padding: 2px 0;"><strong>Hours:</strong></td><td style="padding: 2px 0; text-align: right;">${e.totalHours}h</td></tr>
            <tr><td style="padding: 2px 0;"><strong>Rate:</strong></td><td style="padding: 2px 0; text-align: right;">₱${e.rate}/hr</td></tr>
            <tr style="border-top: 1px dashed #000;"><td style="padding: 3px 0;"><strong>Gross Pay:</strong></td><td style="padding: 3px 0; text-align: right;">₱${e.grossPay.toFixed(2)}</td></tr>
            ${debt > 0 ? `<tr><td style="padding: 2px 0;"><strong>Deductions:</strong></td><td style="padding: 2px 0; text-align: right; color: #000;">-₱${debt.toFixed(2)}</td></tr>` : ''}
            <tr style="border-top: 1px solid #000; font-size: 13px;">
              <td style="padding: 4px 0;"><strong>NET PAY:</strong></td>
              <td style="padding: 4px 0; text-align: right;"><strong>₱${Math.max(0, net).toFixed(2)}</strong></td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 8px; padding-top: 4px; border-top: 1px dashed #000; font-size: 9px;">
            Thank you!
          </div>
        </div>
      `
    }).join("")

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Pay Slips</title>
      <style>
        @page { margin: 3mm; size: 80mm auto; }
        body { margin: 0; padding: 3mm; }
        @media print { body { margin: 0; padding: 3mm; } }
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
