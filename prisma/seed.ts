import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const password = await bcrypt.hash("581984", 12)

  const admin = await db.user.upsert({
    where: { email: "admin@jumongdev.com" },
    update: {},
    create: {
      employeeId: "ADMIN001",
      fullName: "Admin User",
      email: "admin@jumongdev.com",
      password,
      phone: "555-0000",
      position: "System Admin",
      department: "Administration",
      role: "admin",
      rate: 50,
    },
  })
  console.log("Admin created:", admin.email)

  const employees = [
    { employeeId: "EMP001", fullName: "John Doe", email: "john@company.com", phone: "555-0101", position: "Software Engineer", department: "Engineering", rate: 45 },
    { employeeId: "EMP002", fullName: "Jane Smith", email: "jane@company.com", phone: "555-0102", position: "Product Manager", department: "Product", rate: 55 },
    { employeeId: "EMP003", fullName: "Bob Johnson", email: "bob@company.com", phone: "555-0103", position: "Designer", department: "Design", rate: 40 },
  ]

  for (const emp of employees) {
    const user = await db.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        password,
        role: "employee",
      },
    })

    const months = ["January", "February", "March", "April"]
    for (let i = 0; i < months.length; i++) {
      const basic = emp.rate * 160
      const housing = basic * 0.2
      const transport = 300
      const other = 200
      const deductions = 150
      const tax = basic * 0.1
      const net = basic + housing + transport + other - deductions - tax

      await db.salary.upsert({
        where: { id: `${user.id}-${months[i]}-2025` },
        update: {},
        create: {
          id: `${user.id}-${months[i]}-2025`,
          userId: user.id,
          basicSalary: basic,
          housingAllowance: housing,
          transportAllowance: transport,
          otherAllowances: other,
          deductions,
          tax,
          netSalary: net,
          month: months[i],
          year: 2025,
          status: i < 3 ? "paid" : "pending",
          paymentDate: i < 3 ? new Date(`2025-${String(i + 1).padStart(2, "0")}-01`) : null,
        },
      })
    }
  }

  console.log("Seed complete!")
  console.log("Admin login: admin@jumongdev.com / 581984")
  console.log("Employee login: john@company.com / password123")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
