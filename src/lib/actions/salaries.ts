"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createSalary(formData: FormData) {
  const userId = formData.get("userId") as string
  const basicSalary = parseFloat(formData.get("basicSalary") as string) || 0
  const housingAllowance = parseFloat(formData.get("housingAllowance") as string) || 0
  const transportAllowance = parseFloat(formData.get("transportAllowance") as string) || 0
  const otherAllowances = parseFloat(formData.get("otherAllowances") as string) || 0
  const deductions = parseFloat(formData.get("deductions") as string) || 0
  const tax = parseFloat(formData.get("tax") as string) || 0
  const month = formData.get("month") as string
  const year = parseInt(formData.get("year") as string)
  const status = (formData.get("status") as string) || "pending"
  const notes = (formData.get("notes") as string) || null
  const paymentDate = formData.get("paymentDate") as string

  const netSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances - deductions - tax

  await db.salary.create({
    data: {
      userId,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      deductions,
      tax,
      netSalary,
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
