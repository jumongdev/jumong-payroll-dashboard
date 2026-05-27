"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createCompany(formData: FormData) {
  const name = formData.get("name") as string
  const address = formData.get("address") as string

  await db.company.create({
    data: { name, address: address || null },
  })

  revalidatePath("/dashboard/companies")
}

export async function updateCompanyLocation(formData: FormData) {
  const id = formData.get("id") as string
  const latitude = parseFloat(formData.get("latitude") as string)
  const longitude = parseFloat(formData.get("longitude") as string)

  await db.company.update({
    where: { id },
    data: { latitude: isNaN(latitude) ? null : latitude, longitude: isNaN(longitude) ? null : longitude },
  })

  revalidatePath("/dashboard/companies")
}

export async function updateCompany(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const qrCode = formData.get("qrCode") as string

  const data: any = {}
  if (name) data.name = name
  if (address !== undefined) data.address = address || null
  if (qrCode) data.qrCode = qrCode

  await db.company.update({ where: { id }, data })
  revalidatePath("/dashboard/companies")
}

export async function deleteCompany(id: string) {
  await db.company.delete({ where: { id } })
  revalidatePath("/dashboard/companies")
}

export async function clearQrCode(companyId: string) {
  await db.company.update({
    where: { id: companyId },
    data: { qrCode: null },
  })
  revalidatePath("/dashboard/companies")
}

export async function toggleCompanySetting(companyId: string, field: "earlyInPaid" | "lateOutPaid", value: boolean) {
  await db.company.update({
    where: { id: companyId },
    data: { [field]: value },
  })
  revalidatePath("/dashboard/companies")
}
