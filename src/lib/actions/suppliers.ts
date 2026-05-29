"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function addSupplier(formData: FormData) {
  const name = formData.get("name") as string
  const contact = (formData.get("contact") as string) || null
  const phone = (formData.get("phone") as string) || null
  if (!name) return
  await db.supplier.upsert({
    where: { name },
    update: { contact, phone },
    create: { name, contact, phone },
  })
  revalidatePath("/dashboard/cheques")
}

export async function deleteSupplier(id: string) {
  await db.supplier.delete({ where: { id } })
  revalidatePath("/dashboard/cheques")
}
