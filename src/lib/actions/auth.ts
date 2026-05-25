"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/prisma"
import { signIn } from "@/lib/auth"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  await signIn("credentials", { email, password, redirectTo: "/dashboard" })
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const employeeId = formData.get("employeeId") as string

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { employeeId }] },
  })
  if (existing) {
    throw new Error("User with this email or employee ID already exists")
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: {
      email,
      password: hashed,
      fullName,
      employeeId,
      role: "employee",
    },
  })
}
