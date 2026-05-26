import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditEmployeeForm from "./edit-form"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employee = await db.user.findUnique({ where: { id } })
  if (!employee) notFound()

  return <EditEmployeeForm employee={{
    id: employee.id,
    fullName: employee.fullName,
    email: employee.email,
    employeeId: employee.employeeId,
    address: employee.address,
    mobile: employee.mobile,
    birthDate: employee.birthDate,
    joinDate: employee.joinDate,
    sssNumber: employee.sssNumber,
    pagibigNumber: employee.pagibigNumber,
    philhealthNumber: employee.philhealthNumber,
    designation: employee.designation,
    rate: employee.rate,
    profileImage: employee.profileImage,
  }} />
}
