"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function addStoreImage(companyId: string, title: string, image: string) {
  const count = await db.storeImage.count({ where: { companyId } })
  await db.storeImage.create({
    data: { companyId, title, image, order: count },
  })
  revalidatePath("/dashboard/companies")
  revalidatePath("/dashboard/employee")
}

export async function removeStoreImage(id: string) {
  await db.storeImage.delete({ where: { id } })
  revalidatePath("/dashboard/companies")
  revalidatePath("/dashboard/employee")
}
