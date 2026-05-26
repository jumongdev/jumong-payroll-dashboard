"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"
import { computePhilippinePayroll } from "@/lib/philippine-payroll"

export async function createSalary(formData: FormData) {
  const userId = formData.get("userId") as string
  const basicSalary = parseFloat(formData.get("basicSalary") as string) || 0
  const housingAllowance = parseFloat(formData.get("housingAllowance") as string) || 0
  const transportAllowance = parseFloat(formData.get("transportAllowance") as string) || 0
  const otherAllowances = parseFloat(formData.get("otherAllowances") as string) || 0
  const overtimePay = parseFloat(formData.get("overtimePay") as string) || 0
  const holidayPay = parseFloat(formData.get("holidayPay") as string) || 0
  const thirteenthMonthPay = parseFloat(formData.get("thirteenthMonthPay") as string) || 0
  const deductions = parseFloat(formData.get("deductions") as string) || 0
  const month = formData.get("month") as string
  const year = parseInt(formData.get("year") as string)
  const status = (formData.get("status") as string) || "pending"
  const notes = (formData.get("notes") as string) || null
  const paymentDate = formData.get("paymentDate") as string

  const allowances = housingAllowance + transportAllowance + otherAllowances
  const computed = computePhilippinePayroll(basicSalary, overtimePay, holidayPay, allowances)

  const grossPay = computed.grossPay + thirteenthMonthPay
  const totalDeductions = computed.totalDeductions + deductions
  const netPay = grossPay - totalDeductions

  await db.salary.create({
    data: {
      userId,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      overtimePay,
      holidayPay,
      thirteenthMonthPay,
      grossPay,
      sssContribution: computed.sssContribution,
      philhealthContribution: computed.philhealthContribution,
      pagibigContribution: computed.pagibigContribution,
      withholdingTax: computed.withholdingTax,
      deductions,
      tax: computed.withholdingTax,
      netSalary: netPay,
      netPay,
      month,
      year,
      status,
      notes,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
    },
  })

  revalidatePath("/dashboard/salaries")
}

export async function updateSalaryStatus(id: string, status: string) {
  await db.salary.update({
    where: { id },
    data: {
      status,
      paymentDate: status === "paid" ? new Date() : undefined,
    },
  })
  revalidatePath("/dashboard/salaries")
}

export async function deleteSalary(id: string) {
  await db.salary.delete({ where: { id } })
  revalidatePath("/dashboard/salaries")
}
