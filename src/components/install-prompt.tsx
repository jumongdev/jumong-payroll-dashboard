"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

let deferredPrompt: any = null

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setDismissed(true)
    }
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    deferredPrompt = null
    setShow(false)
    if (result.outcome === "accepted") setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white rounded-xl shadow-lg border border-emerald-200 max-w-sm mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">J</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900">Install Jumong Payroll</p>
          <p className="text-xs text-zinc-500">Add to home screen for quick access</p>
        </div>
        <button
          onClick={install}
          className="shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-1"
        >
          <Download size={12} />
          Install
        </button>
      </div>
    </div>
  )
}
