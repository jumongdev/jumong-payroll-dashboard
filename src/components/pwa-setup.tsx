"use client"

import { useEffect } from "react"
import InstallPrompt from "@/components/install-prompt"

export default function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
    }
  }, [])

  return <InstallPrompt />
}
