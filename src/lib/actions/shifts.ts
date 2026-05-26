"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createShift(formData: FormData) {
  const companyId = formData.get("companyId") as string
  const name = formData.get("name") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string

  await db.shift.create({
    data: { companyId, name, startTime, endTime },
  })

  revalidatePath("/dashboard/companies")
}

export async function deleteShift(id: string) {
  await db.shift.delete({ where: { id } })
  revalidatePath("/dashboard/companies")
}
