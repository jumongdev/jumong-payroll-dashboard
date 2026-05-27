"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"
import { getPhilippineToday } from "@/lib/utils"

export async function checkIn(userId: string, date: Date, photo: string, lat: number, lng: number) {
  try {
    const { start: startOfDay, end: endOfDay } = getPhilippineToday()

    const existing = await db.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })

    if (existing) return { error: "Already checked in today" }

    await db.attendance.create({
      data: {
        userId,
        date: new Date(),
        checkIn: new Date(),
        checkInPhoto: photo || null,
        checkInLat: lat || null,
        checkInLng: lng || null,
        status: "present",
      },
    })

    revalidatePath("/dashboard/attendance")
    revalidatePath("/dashboard/employee")
    return { success: true }
  } catch (e: any) {
    return { error: e.message || "Failed to check in" }
  }
}

export async function checkOut(userId: string, date: Date, photo: string, lat: number, lng: number) {
  try {
    const { start: startOfDay, end: endOfDay } = getPhilippineToday()

    const record = await db.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })

    if (!record) return { error: "No check-in found for today" }
    if (record.checkOut) return { error: "Already checked out today" }

    await db.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: new Date(),
        checkOutPhoto: photo || null,
        checkOutLat: lat || null,
        checkOutLng: lng || null,
      },
    })

    revalidatePath("/dashboard/attendance")
    revalidatePath("/dashboard/employee")
    return { success: true }
  } catch (e: any) {
    return { error: e.message || "Failed to check out" }
  }
}

export async function updateAttendanceStatus(id: string, status: string, notes?: string) {
  await db.attendance.update({
    where: { id },
    data: { status, notes: notes || null },
  })
  revalidatePath("/dashboard/attendance")
}
