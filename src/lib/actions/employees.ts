"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function createEmployee(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = (formData.get("password") as string) || "password123"
  const address = formData.get("address") as string
  const mobile = formData.get("mobile") as string
  const birthDate = formData.get("birthDate") as string
  const sssNumber = formData.get("sssNumber") as string
  const pagibigNumber = formData.get("pagibigNumber") as string
  const philhealthNumber = formData.get("philhealthNumber") as string
  const designation = formData.get("designation") as string
  const rate = parseFloat(formData.get("rate") as string) || 0
  const joinDate = formData.get("joinDate") as string
  const role = (formData.get("role") as string) || "employee"
  const gender = formData.get("gender") as string

  const count = await db.user.count()
  const employeeId = `EMP${String(count + 1).padStart(3, "0")}`

  await db.user.create({
    data: {
      email,
      fullName,
      employeeId,
      password: await import("bcryptjs").then((b) =>
        b.hash(password, 12)
      ),
      address: address || null,
      mobile: mobile || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      sssNumber: sssNumber || null,
      pagibigNumber: pagibigNumber || null,
      philhealthNumber: philhealthNumber || null,
      gender: gender || null,
      designation: designation || null,
      rate,
      role,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
    },
  })

  revalidatePath("/dashboard/employees")
  return { email, password, employeeId, fullName }
}

export async function updateEmployee(formData: FormData) {
  const id = formData.get("id") as string
  const email = formData.get("email") as string
  const fullName = formData.get("fullName") as string
  const address = formData.get("address") as string
  const mobile = formData.get("mobile") as string
  const birthDate = formData.get("birthDate") as string
  const sssNumber = formData.get("sssNumber") as string
  const pagibigNumber = formData.get("pagibigNumber") as string
  const philhealthNumber = formData.get("philhealthNumber") as string
  const designation = formData.get("designation") as string
  const rate = parseFloat(formData.get("rate") as string) || 0
  const profileImage = formData.get("profileImage") as string
  const gender = formData.get("gender") as string

  await db.user.update({
    where: { id },
    data: {
      email,
      fullName,
      address: address || null,
      mobile: mobile || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      sssNumber: sssNumber || null,
      pagibigNumber: pagibigNumber || null,
      philhealthNumber: philhealthNumber || null,
      gender: gender || null,
      designation: designation || null,
      rate,
      profileImage: profileImage || null,
    },
  })

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/employees/[id]/edit", "page")
}

export async function deleteEmployee(id: string) {
  await db.user.delete({ where: { id } })
  revalidatePath("/dashboard/employees")
}

export async function updateProfile(formData: FormData) {
  const id = formData.get("id") as string
  const address = formData.get("address") as string
  const mobile = formData.get("mobile") as string
  const birthDate = formData.get("birthDate") as string
  const sssNumber = formData.get("sssNumber") as string
  const pagibigNumber = formData.get("pagibigNumber") as string
  const philhealthNumber = formData.get("philhealthNumber") as string
  const profileImage = formData.get("profileImage") as string
  const gender = formData.get("gender") as string

  await db.user.update({
    where: { id },
    data: {
      address: address || null,
      mobile: mobile || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      sssNumber: sssNumber || null,
      pagibigNumber: pagibigNumber || null,
      philhealthNumber: philhealthNumber || null,
      gender: gender || null,
      profileImage: profileImage || null,
    },
  })

  revalidatePath("/dashboard/account")
}
