"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function updateAdvisory(formData: FormData) {
  const message = formData.get("message") as string
  const existing = await db.advisory.findFirst()
  if (existing) {
    await db.advisory.update({ where: { id: existing.id }, data: { message } })
  } else {
    await db.advisory.create({ data: { message } })
  }
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/employee")
}
