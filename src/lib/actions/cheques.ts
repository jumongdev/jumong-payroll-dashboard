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

export async function updateCheque(
  id: string,
  data: {
    chequeNo: string
    payee: string
    amount: number
    bank: string
    issueDate: string
    dueDate: string | null
    voucherNo: string | null
    notes: string | null
  },
) {
  if (!data.chequeNo || !data.payee || data.amount <= 0 || !data.issueDate) return

  await db.cheque.update({
    where: { id },
    data: {
      chequeNo: data.chequeNo,
      payee: data.payee,
      amount: data.amount,
      bank: data.bank || "—",
      issueDate: new Date(`${data.issueDate}T00:00:00+08:00`),
      dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00+08:00`) : null,
      voucherNo: data.voucherNo,
      notes: data.notes,
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
