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
  Home,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/companies", label: "Companies", icon: Building },
  { href: "/dashboard/schedules", label: "Schedule", icon: ClipboardList },
  { href: "/dashboard/payroll", label: "Payroll", icon: DollarSign },
  { href: "/dashboard/daily-earnings", label: "Earnings", icon: TrendingUp },
  { href: "/dashboard/salaries", label: "Salaries", icon: FileText },
  { href: "/dashboard/attendance", label: "Attendance", icon: Clock },
]

const employeeLinks = [
  { href: "/dashboard/employee", label: "Home", icon: Home },
  { href: "/dashboard/account", label: "Profile", icon: User },
  { href: "/dashboard/daily-earnings", label: "Earnings", icon: TrendingUp },
  { href: "/dashboard/salaries", label: "Salary", icon: DollarSign },
  { href: "/dashboard/payslips", label: "Payslip", icon: FileText },
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
        className="fixed top-3 left-3 z-50 lg:hidden glass-card p-2.5 rounded-xl"
      >
        {open ? <X size={20} className="text-zinc-700" /> : <Menu size={20} className="text-zinc-700" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 glass flex flex-col border-r border-white/50 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-zinc-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900">JumongDev</p>
              <p className="text-xs text-zinc-500">Payroll System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <link.icon size={18} className="shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100/50">
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass border-t border-white/50 safe-bottom">
        <nav className="flex items-center justify-around px-2 py-1.5">
          {links.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200",
                pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))
                  ? "text-emerald-600"
                  : "text-zinc-400"
              )}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
