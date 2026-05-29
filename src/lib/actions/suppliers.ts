"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function addSupplier(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return
  await db.supplier.upsert({
    where: { name },
    update: { name },
    create: { name },
  })
  revalidatePath("/dashboard/cheques")
}

export async function deleteSupplier(id: string) {
  await db.supplier.delete({ where: { id } })
  revalidatePath("/dashboard/cheques")
}
