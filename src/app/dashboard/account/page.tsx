import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import AccountView from "./account-view"

export default async function AccountPage() {
  const session = await auth()
  const userId = session?.user?.id

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeId: true,
      mobile: true,
      address: true,
      birthDate: true,
      designation: true,
      rate: true,
      joinDate: true,
      sssNumber: true,
      pagibigNumber: true,
      philhealthNumber: true,
      gender: true,
      role: true,
      profileImage: true,
    },
  })

  if (!user) return <p className="text-zinc-500">Account not found.</p>

  return (
    <AccountView
      user={{
        ...user,
        birthDate: user.birthDate?.toISOString() ?? null,
        joinDate: user.joinDate.toISOString(),
        profileImage: user.profileImage,
      }}
    />
  )
}
