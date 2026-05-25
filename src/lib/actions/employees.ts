"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createEmployee(formData: FormData) {
  const email = formData.get("email") as string
  const fullName = formData.get("fullName") as string
  const employeeId = formData.get("employeeId") as string
  const phone = formData.get("phone") as string
  const position = formData.get("position") as string
  const department = formData.get("department") as string
  const rate = parseFloat(formData.get("rate") as string) || 0
  const joinDate = formData.get("joinDate") as string

  await db.user.create({
    data: {
      email,
      fullName,
      employeeId,
      password: await import("bcryptjs").then((b) =>
        b.hash("password123", 12)
      ),
      phone: phone || null,
      position: position || null,
      department: department || null,
      rate,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
    },
  })

  revalidatePath("/dashboard/employees")
}

export async function updateEmployee(formData: FormData) {
  const id = formData.get("id") as string
  const email = formData.get("email") as string
  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const position = formData.get("position") as string
  const department = formData.get("department") as string
  const rate = parseFloat(formData.get("rate") as string) || 0

  await db.user.update({
    where: { id },
    data: { email, fullName, phone: phone || null, position: position || null, department: department || null, rate },
  })

  revalidatePath("/dashboard/employees")
}

export async function deleteEmployee(id: string) {
  await db.user.delete({ where: { id } })
  revalidatePath("/dashboard/employees")
}
