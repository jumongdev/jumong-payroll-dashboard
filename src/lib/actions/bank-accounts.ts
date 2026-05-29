"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function addBankAccount(formData: FormData) {
  const bank = formData.get("bank") as string
  const accountName = formData.get("accountName") as string
  const accountNumber = formData.get("accountNumber") as string
  if (!bank || !accountName || !accountNumber) return

  await db.bankAccount.create({
    data: { bank, accountName, accountNumber },
  })
  revalidatePath("/dashboard/cheques")
}

export async function deleteBankAccount(id: string) {
  await db.bankAccount.delete({ where: { id } })
  revalidatePath("/dashboard/cheques")
}
