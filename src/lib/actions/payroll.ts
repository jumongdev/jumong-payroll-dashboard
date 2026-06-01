"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/prisma"
import { computePaidHours } from "@/lib/utils"

export async function addDebt(formData: FormData) {
  const userId = formData.get("userId") as string
  const amount = parseFloat(formData.get("amount") as string) || 0
  const type = formData.get("type") as string
  const description = formData.get("description") as string

  if (!userId || amount <= 0) return

  const debt = await db.employeeDebt.create({
    data: { userId, amount, remaining: amount, type, description: description || null },
  })

  await db.debtTransaction.create({
    data: {
      debtId: debt.id,
      amount: amount,
      type: "add",
      source: type.replace("_", " "),
      notes: description || null,
    },
  })

  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/payroll")
}

export async function deleteDebt(id: string) {
  await db.employeeDebt.delete({ where: { id } })
  revalidatePath("/dashboard/employees")
  revalidatePath("/dashboard/payroll")
}

export async function computePayroll(formData: FormData) {
  const weekStart = formData.get("weekStart") as string
  const weekEnd = formData.get("weekEnd") as string

  const startDate = new Date(weekStart)
  const endDate = new Date(weekEnd + "T23:59:59")

  const existingPeriod = await db.payrollPeriod.findFirst({
    where: { weekStart: startDate, weekEnd: endDate },
  })

  let periodId = existingPeriod?.id

  if (!existingPeriod) {
    const period = await db.payrollPeriod.create({
      data: { weekStart: startDate, weekEnd: endDate },
    })
    periodId = period.id

    const employees = await db.user.findMany({
      where: { role: "employee" },
      select: { id: true, rate: true },
    })

    const allAttendances = await db.attendance.findMany({
      where: {
        userId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
        checkIn: { not: null },
        checkOut: { not: null },
        status: { not: "absent" },
      },
    })

    const allSchedules = await db.schedule.findMany({
      where: {
        userId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
      },
      include: { shift: { select: { startTime: true, endTime: true } }, company: { select: { earlyInPaid: true, lateOutPaid: true } } },
    })

    const debts = await db.employeeDebt.findMany({
      where: { userId: { in: employees.map((e) => e.id) }, remaining: { gt: 0 } },
    })

    for (const emp of employees) {
      const empAttendances = allAttendances.filter((a) => a.userId === emp.id)
      const empSchedules = allSchedules.filter((s) => s.userId === emp.id)
      const totalHours = empAttendances.reduce((sum, a) => {
        const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(a.date)
        const sched = empSchedules.find(
          (s) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(s.date) === dateStr
        )
        if (sched?.shift?.endTime) {
          return sum + computePaidHours(a.checkIn!, a.checkOut!, sched.shift.startTime, sched.shift.endTime, dateStr, sched.company.earlyInPaid, sched.company.lateOutPaid)
        }
        const diff = (a.checkOut!.getTime() - a.checkIn!.getTime()) / 3600000
        return sum + diff
      }, 0)

      const empDebts = debts.filter((d) => d.userId === emp.id)
      const totalDebt = empDebts.reduce((sum, d) => sum + d.remaining, 0)

      if (totalHours > 0 || totalDebt > 0) {
        const grossPay = totalHours * (emp.rate || 0)
        const netPay = grossPay

        await db.payrollEntry.create({
          data: {
            payrollPeriodId: periodId,
            userId: emp.id,
            totalHours: Math.round(totalHours * 100) / 100,
            rate: emp.rate || 0,
            grossPay: Math.round(grossPay * 100) / 100,
            deductions: Math.round(totalDebt * 100) / 100,
            netPay: Math.round(netPay * 100) / 100,
          },
        })
      }
    }
  }

  revalidatePath("/dashboard/payroll")
}

export async function payEmployee(entryId: string, periodId: string, deductionAmount: number) {
  await db.payrollEntry.update({
    where: { id: entryId },
    data: { status: "paid", paidAt: new Date() },
  })

  const entry = await db.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      user: { select: { employeeId: true } },
      payrollPeriod: { select: { weekStart: true, weekEnd: true } },
    },
  })

  if (entry) {
    const netPay = entry.grossPay - deductionAmount
    await db.payrollEntry.update({
      where: { id: entryId },
      data: { netPay, deductions: deductionAmount },
    })

    await db.salary.create({
      data: {
        userId: entry.userId,
        basicSalary: entry.grossPay,
        netSalary: netPay,
        netPay,
        grossPay: entry.grossPay,
        deductions: deductionAmount,
        month: new Date().toLocaleString("en-US", { month: "long" }),
        year: new Date().getFullYear(),
        status: "paid",
        paymentDate: new Date(),
      },
    })

    const weekLabel = entry.payrollPeriod
      ? `${entry.payrollPeriod.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${entry.payrollPeriod.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : null

    if (deductionAmount > 0) {
      let remaining = deductionAmount
      const debts = await db.employeeDebt.findMany({
        where: { userId: entry.userId, remaining: { gt: 0 } },
        orderBy: { date: "asc" },
      })

      for (const debt of debts) {
        if (remaining <= 0) break
        const deduct = Math.min(remaining, debt.remaining)
        await db.employeeDebt.update({
          where: { id: debt.id },
          data: { remaining: { decrement: deduct }, deducted: (debt.remaining - deduct) <= 0 },
        })
        await db.debtTransaction.create({
          data: {
            debtId: debt.id,
            amount: -deduct,
            type: "deduct",
            source: weekLabel,
            notes: debt.description || null,
          },
        })
        remaining -= deduct
      }
    }
  }

  const pending = await db.payrollEntry.findFirst({
    where: { payrollPeriodId: periodId, status: "pending" },
  })

  if (!pending) {
    await db.payrollPeriod.update({
      where: { id: periodId },
      data: { status: "paid" },
    })
  }

  revalidatePath("/dashboard/payroll")
}
