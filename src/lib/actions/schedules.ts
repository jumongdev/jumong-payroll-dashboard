"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"

export async function assignSchedule(formData: FormData) {
  const userId = formData.get("userId") as string
  const companyId = formData.get("companyId") as string
  const date = formData.get("date") as string
  const shiftId = formData.get("shiftId") as string
  const notes = formData.get("notes") as string

  await db.schedule.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    update: { companyId, shiftId: shiftId || null, notes: notes || null },
    create: {
      userId,
      companyId,
      shiftId: shiftId || null,
      date: new Date(date),
      notes: notes || null,
    },
  })

  revalidatePath("/dashboard/schedules")
}

export async function removeSchedule(userId: string, date: string) {
  await db.schedule.deleteMany({
    where: { userId, date: new Date(date) },
  })
  revalidatePath("/dashboard/schedules")
}

export async function copyScheduleToNextWeek(formData: FormData) {
  const fromDate = formData.get("fromDate") as string
  const fromStart = new Date(fromDate)
  const fromEnd = new Date(fromDate + "T23:59:59")
  const toDate = formData.get("toDate") as string

  const schedules = await db.schedule.findMany({
    where: { date: { gte: fromStart, lte: fromEnd } },
  })

  for (const s of schedules) {
    await db.schedule.upsert({
      where: { userId_date: { userId: s.userId, date: new Date(toDate) } },
      update: { companyId: s.companyId, shiftId: s.shiftId },
      create: {
        userId: s.userId,
        companyId: s.companyId,
        shiftId: s.shiftId,
        date: new Date(toDate),
      },
    })
  }

  revalidatePath("/dashboard/schedules")
}
