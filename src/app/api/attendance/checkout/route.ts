import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { getPhilippineToday } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const { userId, date, photo, lat, lng } = await req.json()

    const { start: startOfDay, end: endOfDay } = getPhilippineToday()

    const record = await db.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })

    if (!record) {
      return NextResponse.json({ error: "No check-in found for today" }, { status: 404 })
    }
    if (record.checkOut) {
      return NextResponse.json({ error: "Already checked out today" }, { status: 409 })
    }

    await db.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: new Date(date),
        checkOutPhoto: photo || null,
        checkOutLat: lat || null,
        checkOutLng: lng || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to check out" }, { status: 500 })
  }
}
