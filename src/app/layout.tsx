import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import PwaSetup from "@/components/pwa-setup"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "JumongDev Payroll",
  description: "Philippine Payroll Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "JumongDev Payroll",
    statusBarStyle: "default",
  },
  applicationName: "JumongDev Payroll",
}

export const viewport = {
  themeColor: "#009661",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jumong Payroll" />
        <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-screen bg-zinc-50">
        {children}
        <PwaSetup />
      </body>
    </html>
  )
}
