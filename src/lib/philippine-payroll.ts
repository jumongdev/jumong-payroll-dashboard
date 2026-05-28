const SSS_TABLE: { min: number; max: number; msc: number; ee: number }[] = [
  { min: 0, max: 4249.99, msc: 4000, ee: 180 },
  { min: 4250, max: 4749.99, msc: 4500, ee: 202.5 },
  { min: 4750, max: 5249.99, msc: 5000, ee: 225 },
  { min: 5250, max: 5749.99, msc: 5500, ee: 247.5 },
  { min: 5750, max: 6249.99, msc: 6000, ee: 270 },
  { min: 6250, max: 6749.99, msc: 6500, ee: 292.5 },
  { min: 6750, max: 7249.99, msc: 7000, ee: 315 },
  { min: 7250, max: 7749.99, msc: 7500, ee: 337.5 },
  { min: 7750, max: 8249.99, msc: 8000, ee: 360 },
  { min: 8250, max: 8749.99, msc: 8500, ee: 382.5 },
  { min: 8750, max: 9249.99, msc: 9000, ee: 405 },
  { min: 9250, max: 9749.99, msc: 9500, ee: 427.5 },
  { min: 9750, max: 10249.99, msc: 10000, ee: 450 },
  { min: 10250, max: 10749.99, msc: 10500, ee: 472.5 },
  { min: 10750, max: 11249.99, msc: 11000, ee: 495 },
  { min: 11250, max: 11749.99, msc: 11500, ee: 517.5 },
  { min: 11750, max: 12249.99, msc: 12000, ee: 540 },
  { min: 12250, max: 12749.99, msc: 12500, ee: 562.5 },
  { min: 12750, max: 13249.99, msc: 13000, ee: 585 },
  { min: 13250, max: 13749.99, msc: 13500, ee: 607.5 },
  { min: 13750, max: 14249.99, msc: 14000, ee: 630 },
  { min: 14250, max: 14749.99, msc: 14500, ee: 652.5 },
  { min: 14750, max: 15249.99, msc: 15000, ee: 675 },
  { min: 15250, max: 15749.99, msc: 15500, ee: 697.5 },
  { min: 15750, max: 16249.99, msc: 16000, ee: 720 },
  { min: 16250, max: 16749.99, msc: 16500, ee: 742.5 },
  { min: 16750, max: 17249.99, msc: 17000, ee: 765 },
  { min: 17250, max: 17749.99, msc: 17500, ee: 787.5 },
  { min: 17750, max: 18249.99, msc: 18000, ee: 810 },
  { min: 18250, max: 18749.99, msc: 18500, ee: 832.5 },
  { min: 18750, max: 19249.99, msc: 19000, ee: 855 },
  { min: 19250, max: 19749.99, msc: 19500, ee: 877.5 },
  { min: 19750, max: 20249.99, msc: 20000, ee: 900 },
  { min: 20250, max: 20749.99, msc: 20500, ee: 922.5 },
  { min: 20750, max: 21249.99, msc: 21000, ee: 945 },
  { min: 21250, max: 21749.99, msc: 21500, ee: 967.5 },
  { min: 21750, max: 22249.99, msc: 22000, ee: 990 },
  { min: 22250, max: 22749.99, msc: 22500, ee: 1012.5 },
  { min: 22750, max: 23249.99, msc: 23000, ee: 1035 },
  { min: 23250, max: 23749.99, msc: 23500, ee: 1057.5 },
  { min: 23750, max: 24249.99, msc: 24000, ee: 1080 },
  { min: 24250, max: 24749.99, msc: 24500, ee: 1102.5 },
  { min: 24750, max: 25249.99, msc: 25000, ee: 1125 },
  { min: 25250, max: 25749.99, msc: 25500, ee: 1147.5 },
  { min: 25750, max: 26249.99, msc: 26000, ee: 1170 },
  { min: 26250, max: 26749.99, msc: 26500, ee: 1192.5 },
  { min: 26750, max: 27249.99, msc: 27000, ee: 1215 },
  { min: 27250, max: 27749.99, msc: 27500, ee: 1237.5 },
  { min: 27750, max: 28249.99, msc: 28000, ee: 1260 },
  { min: 28250, max: 28749.99, msc: 28500, ee: 1282.5 },
  { min: 28750, max: 29249.99, msc: 29000, ee: 1305 },
  { min: 29250, max: 29749.99, msc: 29500, ee: 1327.5 },
  { min: 29750, max: Infinity, msc: 30000, ee: 1350 },
]

const WITHHOLDING_TAX_TABLE: { min: number; max: number; base: number; rate: number }[] = [
  { min: 0, max: 20833, base: 0, rate: 0 },
  { min: 20833, max: 33333, base: 0, rate: 0.15 },
  { min: 33333, max: 66667, base: 1875, rate: 0.2 },
  { min: 66667, max: 166667, base: 8541.8, rate: 0.25 },
  { min: 166667, max: 666667, base: 33541.8, rate: 0.3 },
  { min: 666667, max: Infinity, base: 183541.8, rate: 0.35 },
]

export interface PhilPayrollResult {
  sssContribution: number
  philhealthContribution: number
  pagibigContribution: number
  withholdingTax: number
  grossPay: number
  totalDeductions: number
  netPay: number
}

export function computeSSS(basicSalary: number): number {
  const bracket = SSS_TABLE.find((b) => basicSalary >= b.min && basicSalary <= b.max)
  return bracket ? bracket.ee : 0
}

export function computePhilHealth(basicSalary: number): number {
  const base = Math.max(10000, Math.min(basicSalary, 100000))
  return Math.round(base * 0.025 * 100) / 100
}

export function computePagIbig(basicSalary: number): number {
  if (basicSalary <= 1500) return basicSalary * 0.01
  if (basicSalary <= 5000) return basicSalary * 0.02
  return Math.min(basicSalary * 0.02, 200)
}

export function computeWithholdingTax(monthlyGross: number): number {
  const bracket = WITHHOLDING_TAX_TABLE.find((b) => monthlyGross > b.min && monthlyGross <= b.max)
  if (!bracket || bracket.rate === 0) return 0
  const excess = monthlyGross - bracket.min
  return Math.round((bracket.base + excess * bracket.rate) * 100) / 100
}

export function computePhilippinePayroll(basicSalary: number, overtimePay = 0, holidayPay = 0, allowances = 0): PhilPayrollResult {
  const grossPay = basicSalary + overtimePay + holidayPay + allowances
  const sssContribution = computeSSS(basicSalary)
  const philhealthContribution = computePhilHealth(basicSalary)
  const pagibigContribution = computePagIbig(basicSalary)
  const taxableIncome = grossPay - sssContribution - philhealthContribution - pagibigContribution
  const withholdingTax = computeWithholdingTax(taxableIncome)
  const totalDeductions = sssContribution + philhealthContribution + pagibigContribution + withholdingTax
  const netPay = grossPay - totalDeductions

  return {
    sssContribution,
    philhealthContribution,
    pagibigContribution,
    withholdingTax,
    grossPay,
    totalDeductions,
    netPay,
  }
}
