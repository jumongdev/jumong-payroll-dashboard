import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMinutes } from "date-fns"

const PH_TIMEZONE = "Asia/Manila"

export function getPhilippineToday(): { start: Date; end: Date; dateStr: string } {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const start = new Date(`${dateStr}T00:00:00+08:00`)
  const end = new Date(`${dateStr}T23:59:59+08:00`)
  return { start, end, dateStr }
}

export function getPhilippineWeekRange(): { monday: Date; sunday: Date } {
  const { dateStr } = getPhilippineToday()
  const today = new Date(`${dateStr}T12:00:00+08:00`)
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d)
}

export function to12Hour(time24: string): string {
  const [h, m] = time24.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

export function hoursWorked(checkIn: Date, checkOut: Date): string {
  const minutes = differenceInMinutes(checkOut, checkIn)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function computePaidHours(
  checkIn: Date,
  checkOut: Date,
  shiftStartTime: string,
  shiftEndTime: string,
  dateStr: string,
  earlyInPaid = true,
  lateOutPaid = false
): number {
  const [sh, sm] = shiftStartTime.split(":").map(Number)
  const [eh, em] = shiftEndTime.split(":").map(Number)
  const shiftStart = new Date(`${dateStr}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00+08:00`)
  const shiftEnd = new Date(`${dateStr}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00+08:00`)
  const effectiveStart = earlyInPaid ? checkIn : (checkIn > shiftStart ? checkIn : shiftStart)
  const effectiveEnd = lateOutPaid ? checkOut : (checkOut < shiftEnd ? checkOut : shiftEnd)
  const hours = (effectiveEnd.getTime() - effectiveStart.getTime()) / 3600000
  return Math.max(0, hours)
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
