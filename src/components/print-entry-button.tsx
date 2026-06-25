"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintEntryButton({ entry, weekLabel }: { entry: any; weekLabel: string }) {
  function printEntry() {
    const debt = entry.deductions > 0 ? entry.deductions : 0
    const net = Math.max(0, entry.grossPay - debt)

    const html = `<html><head><title>${entry.user.fullName} - Payslip</title>
<meta charset="utf-8">
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; padding: 3mm; }
  h1 { font-size: 14px; text-align: center; margin-bottom: 2px; }
  .subtitle { text-align: center; font-size: 10px; margin-bottom: 8px; }
  .details { margin-bottom: 8px; text-align: center; }
  .details p { padding: 1px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { border-bottom: 1px solid #000; padding: 3px 2px; text-align: left; font-size: 9px; }
  td { padding: 2px; }
  .amt { text-align: right; font-weight: bold; }
  .total-row td { border-top: 1px solid #000; font-weight: bold; padding-top: 3px; font-size: 11px; }
  .footer { text-align: center; margin-top: 8px; font-size: 8px; border-top: 1px solid #ccc; padding-top: 6px; }
</style>
</head><body>
  <h1>JumongDev Payroll</h1>
  <div class="subtitle">${weekLabel}</div>
  <div class="details">
    <p><strong>${entry.user.fullName}</strong></p>
    <p>${entry.user.designation || "Employee"} &middot; ${entry.totalHours}h worked</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amt">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Hourly Rate</td><td class="amt">₱${entry.rate}/hr</td></tr>
      <tr><td>Total Hours</td><td class="amt">${entry.totalHours}h</td></tr>
      <tr><td>Gross Pay</td><td class="amt">₱${entry.grossPay.toFixed(2)}</td></tr>
      ${debt > 0 ? `<tr><td>Deductions</td><td class="amt" style="color:#dc2626;">-₱${debt.toFixed(2)}</td></tr>` : ""}
      <tr class="total-row"><td>NET PAY</td><td class="amt">₱${net.toFixed(2)}</td></tr>
    </tbody>
  </table>
  <div class="footer">
    <p>Status: ${entry.status.toUpperCase()} &middot; Printed ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
  </div>
</body></html>`

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "-9999px"
    iframe.style.top = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)
    const win = iframe.contentWindow
    const doc = iframe.contentDocument || (win && win.document)
    if (!doc || !win) return
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 300)
  }

  return (
    <Button variant="outline" size="sm" onClick={printEntry} className="h-8 text-xs">
      <Printer size={12} className="mr-1" /> Print
    </Button>
  )
}
