import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { computePhilippinePayroll } from "../src/lib/philippine-payroll"

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
      mobile: "0917-000-0000",
      address: "Manila, Philippines",
      designation: "Driver",
      role: "admin",
      rate: 650,
    },
  })
  console.log("Admin created:", admin.email)

  const employees = [
    { employeeId: "EMP001", fullName: "Juan Dela Cruz", email: "juan@company.com", mobile: "0917-123-4567", designation: "Driver", rate: 650 },
    { employeeId: "EMP002", fullName: "Maria Santos", email: "maria@company.com", mobile: "0918-234-5678", designation: "Cashier", rate: 550 },
    { employeeId: "EMP003", fullName: "Pedro Reyes", email: "pedro@company.com", mobile: "0919-345-6789", designation: "Helper", rate: 520 },
    { employeeId: "EMP004", fullName: "Ana Garcia", email: "ana@company.com", mobile: "0920-456-7890", designation: "Bagger", rate: 500 },
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
      const basic = emp.rate * 26
      const housing = Math.round(basic * 0.1 * 100) / 100
      const transport = 150
      const other = 100
      const allowances = housing + transport + other
      const computed = computePhilippinePayroll(basic, 0, 0, allowances)

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
          overtimePay: 0,
          holidayPay: 0,
          thirteenthMonthPay: 0,
          grossPay: computed.grossPay,
          sssContribution: computed.sssContribution,
          philhealthContribution: computed.philhealthContribution,
          pagibigContribution: computed.pagibigContribution,
          withholdingTax: computed.withholdingTax,
          deductions: 0,
          tax: computed.withholdingTax,
          netSalary: computed.netPay,
          netPay: computed.netPay,
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
  console.log("Employee login: juan@company.com / password123")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
