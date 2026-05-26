import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function PrintPayslip({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payslip = await db.payslip.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, employeeId: true, designation: true, address: true, email: true } },
      salary: true,
    },
  })
  if (!payslip) notFound()

  const s = payslip.salary

  return (
    <html>
      <head>
        <title>Payslip - {payslip.user.fullName} - {s.month} {s.year}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #18181b; max-width: 800px; margin: 0 auto; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #009661; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #009661; font-size: 22px; }
          .header img { height: 40px; }
          h2 { font-size: 16px; color: #52525b; margin-bottom: 16px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .section { margin-bottom: 20px; }
          .section h3 { font-size: 13px; color: #009661; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .row .label { color: #71717a; }
          .row .value { font-weight: 600; }
          .total { border-top: 2px solid #18181b; font-size: 15px; padding-top: 8px; margin-top: 8px; }
          .total .value { font-size: 16px; color: #009661; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; text-align: center; }
          @media print { body { padding: 20px; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <h1>JumongDev Payroll</h1>
            <div style={{fontSize:"12px",color:"#71717a"}}>PH Payroll System</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:700,fontSize:"18px"}}>PAYSLIP</div>
            <div style={{fontSize:"12px",color:"#71717a"}}>{s.month} {s.year}</div>
          </div>
        </div>

        <h2>Employee Details</h2>
        <div className="grid">
          <div>
            <div className="row"><span className="label">Name</span> <span className="value">{payslip.user.fullName}</span></div>
            <div className="row"><span className="label">Employee ID</span> <span className="value">{payslip.user.employeeId}</span></div>
            <div className="row"><span className="label">Designation</span> <span className="value">{payslip.user.designation || "N/A"}</span></div>
          </div>
          <div>
            <div className="row"><span className="label">Email</span> <span className="value">{payslip.user.email}</span></div>
            <div className="row"><span className="label">Address</span> <span className="value">{payslip.user.address || "N/A"}</span></div>
            <div className="row"><span className="label">Pay Period</span> <span className="value">{s.month} {s.year}</span></div>
          </div>
        </div>

        <div className="section">
          <h3>Earnings</h3>
          <div className="row"><span className="label">Basic Salary</span> <span className="value">{formatCurrency(s.basicSalary)}</span></div>
          {s.housingAllowance > 0 && <div className="row"><span className="label">Housing Allowance</span> <span className="value">{formatCurrency(s.housingAllowance)}</span></div>}
          {s.transportAllowance > 0 && <div className="row"><span className="label">Transport Allowance</span> <span className="value">{formatCurrency(s.transportAllowance)}</span></div>}
          {s.overtimePay > 0 && <div className="row"><span className="label">Overtime Pay</span> <span className="value">{formatCurrency(s.overtimePay)}</span></div>}
          {s.holidayPay > 0 && <div className="row"><span className="label">Holiday Pay</span> <span className="value">{formatCurrency(s.holidayPay)}</span></div>}
          {s.thirteenthMonthPay > 0 && <div className="row"><span className="label">13th Month Pay</span> <span className="value">{formatCurrency(s.thirteenthMonthPay)}</span></div>}
          {s.otherAllowances > 0 && <div className="row"><span className="label">Other Allowances</span> <span className="value">{formatCurrency(s.otherAllowances)}</span></div>}
          <div className="row total"><span className="label">GROSS PAY</span> <span className="value">{formatCurrency(s.grossPay || s.basicSalary)}</span></div>
        </div>

        <div className="section">
          <h3>Deductions</h3>
          {s.sssContribution > 0 && <div className="row"><span className="label">SSS Contribution</span> <span className="value" style={{color:"#dc2626"}}>{formatCurrency(s.sssContribution)}</span></div>}
          {s.philhealthContribution > 0 && <div className="row"><span className="label">PhilHealth Contribution</span> <span className="value" style={{color:"#dc2626"}}>{formatCurrency(s.philhealthContribution)}</span></div>}
          {s.pagibigContribution > 0 && <div className="row"><span className="label">Pag-IBIG Contribution</span> <span className="value" style={{color:"#dc2626"}}>{formatCurrency(s.pagibigContribution)}</span></div>}
          {s.withholdingTax > 0 && <div className="row"><span className="label">Withholding Tax</span> <span className="value" style={{color:"#dc2626"}}>{formatCurrency(s.withholdingTax)}</span></div>}
          {s.deductions > 0 && <div className="row"><span className="label">Other Deductions</span> <span className="value" style={{color:"#dc2626"}}>{formatCurrency(s.deductions)}</span></div>}
          <div className="row total"><span className="label">NET PAY</span> <span className="value">{formatCurrency(s.netSalary)}</span></div>
        </div>

        <div className="footer">
          <p>This is a computer-generated payslip. Issued on {formatDate(payslip.issuedAt)}</p>
          <p>JumongDev Payroll System &copy; {new Date().getFullYear()}</p>
        </div>
        <script dangerouslySetInnerHTML={{ __html: "window.onload = function() { window.print() }" }} />
      </body>
    </html>
  )
}
