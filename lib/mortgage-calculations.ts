export interface ApplicantData {
  dateOfBirth: { day: number; month: number; year: number }
  gender: "male" | "female"
  employmentStatus: "working" | "retired"
  plannedRetirementAge: number
  annualIncome: number
  statePension: number
  otherPension: number
}

export interface PropertyData {
  propertyValue: number
  loanAmount: number
}

export interface ProjectionData {
  year: number
  age: number
  propertyValue: number
  loanBalance: number
  equity: number
  income: number
  monthlyPayment: number
}

export type MortgageType =
  | "retirement"
  | "rio"
  | "lifetime"
  | "homeReversion"

export interface MortgageConfig {
  name: string
  shortName: string
  interestRate: number
  description: string
  color: string
  monthlyPaymentType: "interest-only" | "capital-interest" | "optional" | "none"
  loanGrowth: "decreases" | "stable" | "increases" | "fixed"
}

export const MORTGAGE_CONFIGS: Record<MortgageType, MortgageConfig> = {
  retirement: {
    name: "Retirement Mortgage",
    shortName: "Retirement",
    interestRate: 0.055,
    description: "Fixed term, interest-only or capital & interest payments",
    color: "hsl(var(--chart-1))",
    monthlyPaymentType: "capital-interest",
    loanGrowth: "decreases",
  },
  rio: {
    name: "Retirement Interest Only (RIO)",
    shortName: "RIO",
    interestRate: 0.052,
    description: "Interest-only payments required, for life",
    color: "hsl(var(--chart-2))",
    monthlyPaymentType: "interest-only",
    loanGrowth: "stable",
  },
  lifetime: {
    name: "Lifetime Mortgage",
    shortName: "Lifetime",
    interestRate: 0.065,
    description: "No monthly payments required, interest rolls up",
    color: "hsl(var(--chart-3))",
    monthlyPaymentType: "optional",
    loanGrowth: "increases",
  },
  homeReversion: {
    name: "Home Reversion",
    shortName: "Reversion",
    interestRate: 0,
    description: "Sell part of home, no loan balance",
    color: "hsl(var(--chart-4))",
    monthlyPaymentType: "none",
    loanGrowth: "fixed",
  },
}

export function calculateAge(
  dob: { day: number; month: number; year: number },
  currentYear: number = new Date().getFullYear()
): number {
  return currentYear - dob.year
}

export function generateProjections(
  applicant: ApplicantData,
  property: PropertyData,
  mortgageType: MortgageType,
  years: number = 40
): ProjectionData[] {
  const config = MORTGAGE_CONFIGS[mortgageType]
  const startAge = calculateAge(applicant.dateOfBirth)
  const propertyGrowthRate = 0.03 // 3% annual property appreciation
  const inflationRate = 0.025 // 2.5% income growth

  const projections: ProjectionData[] = []

  let loanBalance = property.loanAmount
  let propertyValue = property.propertyValue

  // Calculate home reversion share sold
  const sharePercentSold = mortgageType === "homeReversion" 
    ? (property.loanAmount / property.propertyValue) * 1.5 // Typically get less than market value
    : 0

  for (let year = 0; year <= years; year++) {
    const age = startAge + year
    const isRetired = age >= applicant.plannedRetirementAge

    // Income calculation
    let income: number
    if (isRetired) {
      income = applicant.statePension + applicant.otherPension
    } else {
      income = applicant.annualIncome * Math.pow(1 + inflationRate, year)
    }

    // Property value grows
    propertyValue = property.propertyValue * Math.pow(1 + propertyGrowthRate, year)

    // Calculate monthly payment and loan balance based on mortgage type
    let monthlyPayment = 0

    switch (mortgageType) {
      case "retirement":
        // Capital and interest payments reduce balance
        monthlyPayment = (property.loanAmount * config.interestRate) / 12 * 1.5 // Higher payment to reduce principal
        if (year > 0) {
          loanBalance = Math.max(0, loanBalance - (monthlyPayment * 12 * 0.4)) // Principal portion
        }
        break

      case "rio":
        // Interest-only payments, balance stays same
        monthlyPayment = (loanBalance * config.interestRate) / 12
        // Balance stays stable
        break

      case "lifetime":
        // Interest rolls up, no required payments
        monthlyPayment = 0
        if (year > 0) {
          loanBalance = loanBalance * (1 + config.interestRate)
        }
        break

      case "homeReversion":
        // No loan, just reduced equity ownership
        monthlyPayment = 0
        loanBalance = 0 // No loan balance - sold equity instead
        break
    }

    // Calculate equity
    let equity: number
    if (mortgageType === "homeReversion") {
      // Own remaining share of property
      equity = propertyValue * (1 - sharePercentSold)
    } else {
      equity = Math.max(0, propertyValue - loanBalance)
    }

    projections.push({
      year,
      age,
      propertyValue: Math.round(propertyValue),
      loanBalance: Math.round(loanBalance),
      equity: Math.round(equity),
      income: Math.round(income),
      monthlyPayment: Math.round(monthlyPayment),
    })
  }

  return projections
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
