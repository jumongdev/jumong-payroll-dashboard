import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { getPhilippineToday } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const { userId, date, photo, lat, lng } = await req.json()

    const { start: startOfDay, end: endOfDay } = getPhilippineToday()

    const existing = await db.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })

    if (existing) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 409 })
    }

    await db.attendance.create({
      data: {
        userId,
        date: new Date(date),
        checkIn: new Date(date),
        checkInPhoto: photo || null,
        checkInLat: lat || null,
        checkInLng: lng || null,
        status: "present",
      },
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to check in" }, { status: 500 })
  }
}
