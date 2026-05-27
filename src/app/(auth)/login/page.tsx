"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" })
  }

  return (
    <>
      {error === "not-registered" && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 text-center">
          Your Google account is not registered. Please ask your admin to create your employee account first.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 py-3 text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
            placeholder="admin@jumongdev.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full h-12 rounded-xl border border-zinc-200 px-4 py-3 text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
            placeholder="Enter password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="glass-card rounded-3xl p-8">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <span className="text-white font-bold text-2xl">J</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900">JumongDev Payroll</h1>
            <p className="text-sm text-zinc-500 mt-1">PH Payroll System</p>
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-zinc-400 font-medium">or</span>
            </div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-6">
          JumongDev Payroll &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
      <div className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
      <div className="h-12 bg-zinc-200 rounded-xl animate-pulse" />
    </div>
  )
}
