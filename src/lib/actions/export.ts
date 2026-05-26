"use server"

import { db } from "@/lib/prisma"

export async function exportAttendanceCSV(): Promise<string> {
  const records = await db.attendance.findMany({
    include: { user: { select: { fullName: true, employeeId: true } } },
    orderBy: { date: "desc" },
  })

  const header = "Date,Employee ID,Name,Check In,Check Out,Status,Lat,Lng\n"
  const rows = records.map((r) =>
    `${r.date.toISOString().split("T")[0]},${r.user.employeeId},${r.user.fullName},${r.checkIn?.toISOString() || ""},${r.checkOut?.toISOString() || ""},${r.status},${r.checkInLat || ""},${r.checkInLng || ""}`
  ).join("\n")
  return header + rows
}

export async function exportPayrollCSV(): Promise<string> {
  const entries = await db.payrollEntry.findMany({
    include: {
      user: { select: { fullName: true, employeeId: true } },
      payrollPeriod: true,
    },
    where: { status: "paid" },
    orderBy: { paidAt: "desc" },
  })

  const header = "Week Start,Week End,Employee ID,Name,Hours,Rate,Gross,Deductions,Net,Paid At\n"
  const rows = entries.map((e) =>
    `${e.payrollPeriod.weekStart.toISOString().split("T")[0]},${e.payrollPeriod.weekEnd.toISOString().split("T")[0]},${e.user.employeeId},${e.user.fullName},${e.totalHours},${e.rate},${e.grossPay},${e.deductions},${e.netPay},${e.paidAt?.toISOString() || ""}`
  ).join("\n")
  return header + rows
}

export async function exportDebtsCSV(): Promise<string> {
  const debts = await db.employeeDebt.findMany({
    include: { user: { select: { fullName: true, employeeId: true } } },
    orderBy: { date: "desc" },
  })

  const header = "Date,Employee ID,Name,Type,Description,Amount,Remaining,Deducted\n"
  const rows = debts.map((d) =>
    `${d.date.toISOString().split("T")[0]},${d.user.employeeId},${d.user.fullName},${d.type},${d.description || ""},${d.amount},${d.remaining},${d.deducted}`
  ).join("\n")
  return header + rows
}
