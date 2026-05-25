"use server"

import { db } from "@/lib/prisma"

export async function generatePayslip(salaryId: string, userId: string) {
  const existing = await db.payslip.findFirst({
    where: { salaryId },
  })

  if (existing) {
    return existing.id
  }

  const payslip = await db.payslip.create({
    data: { salaryId, userId },
  })

  return payslip.id
}
