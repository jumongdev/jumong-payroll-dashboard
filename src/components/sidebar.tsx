"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  Building,
  ClipboardList,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/companies", label: "Companies", icon: Building },
  { href: "/dashboard/schedules", label: "Schedule", icon: ClipboardList },
  { href: "/dashboard/payroll", label: "Payroll", icon: DollarSign },
  { href: "/dashboard/salaries", label: "Salaries", icon: FileText },
  { href: "/dashboard/attendance", label: "Attendance", icon: Clock },
]

const employeeLinks = [
  { href: "/dashboard/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/account", label: "My Account", icon: User },
  { href: "/dashboard/salaries", label: "My Salary", icon: DollarSign },
  { href: "/dashboard/payslips", label: "My Payslip", icon: FileText },
]

export default function Sidebar({ user }: { user?: { name?: string | null; email?: string | null; role?: string } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isAdmin = user?.role === "admin"
  const links = isAdmin ? adminLinks : employeeLinks

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow border"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="JumongDev Payroll" className="h-12 w-auto" />
          </div>
          <p className="text-sm text-zinc-500 mt-1">PH Payroll System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
