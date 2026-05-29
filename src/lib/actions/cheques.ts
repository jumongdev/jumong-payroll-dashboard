"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createCheque(formData: FormData) {
  const chequeNo = formData.get("chequeNo") as string
  const payee = formData.get("payee") as string
  const amount = parseFloat(formData.get("amount") as string) || 0
  const bank = formData.get("bank") as string
  const issueDate = formData.get("issueDate") as string
  const dueDate = formData.get("dueDate") as string
  const voucherNo = (formData.get("voucherNo") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!chequeNo || !payee || amount <= 0 || !issueDate) return

  await db.cheque.create({
    data: {
      chequeNo,
      payee,
      amount,
      bank: bank || "—",
      issueDate: new Date(`${issueDate}T00:00:00+08:00`),
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00+08:00`) : null,
      voucherNo,
      notes,
    },
  })

  revalidatePath("/dashboard/cheques")
}

export async function updateChequeStatus(id: string, status: string) {
  const data: Record<string, any> = { status }
  if (status === "cleared") {
    data.clearDate = new Date()
  }
  await db.cheque.update({ where: { id }, data })
  revalidatePath("/dashboard/cheques")
}

export async function deleteCheque(id: string) {
  await db.cheque.delete({ where: { id } })
  revalidatePath("/dashboard/cheques")
}
