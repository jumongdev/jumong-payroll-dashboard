"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function checkIn(userId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const existing = await db.attendance.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  })

  if (existing) {
    throw new Error("Already checked in today")
  }

  await db.attendance.create({
    data: { userId, date: new Date(), checkIn: new Date(), status: "present" },
  })

  revalidatePath("/dashboard/attendance")
}

export async function checkOut(userId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const record = await db.attendance.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  })

  if (!record) {
    throw new Error("No check-in found for today")
  }

  if (record.checkOut) {
    throw new Error("Already checked out today")
  }

  await db.attendance.update({
    where: { id: record.id },
    data: { checkOut: new Date() },
  })

  revalidatePath("/dashboard/attendance")
}

export async function updateAttendanceStatus(id: string, status: string, notes?: string) {
  await db.attendance.update({
    where: { id },
    data: { status, notes: notes || null },
  })
  revalidatePath("/dashboard/attendance")
}
