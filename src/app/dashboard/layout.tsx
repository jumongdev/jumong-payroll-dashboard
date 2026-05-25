import { auth } from "@/lib/auth"
import Sidebar from "@/components/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session?.user} />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
