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

// Accessible color palette - WCAG AA compliant with sufficient contrast
// Colors chosen to be distinguishable for colorblind users (deuteranopia, protanopia, tritanopia)
export const CHART_COLORS = {
  retirement: "#1e40af", // Deep blue
  rio: "#0d9488", // Teal
  lifetime: "#c2410c", // Burnt orange
  homeReversion: "#7c3aed", // Purple
  property: "#059669", // Emerald green
} as const

export const MORTGAGE_CONFIGS: Record<MortgageType, MortgageConfig> = {
  retirement: {
    name: "Retirement Mortgage",
    shortName: "Retirement",
    interestRate: 0.055,
    description: "Fixed term, interest-only or capital & interest payments",
    color: CHART_COLORS.retirement,
    monthlyPaymentType: "capital-interest",
    loanGrowth: "decreases",
  },
  rio: {
    name: "Retirement Interest Only (RIO)",
    shortName: "RIO",
    interestRate: 0.052,
    description: "Interest-only payments required, for life",
    color: CHART_COLORS.rio,
    monthlyPaymentType: "interest-only",
    loanGrowth: "stable",
  },
  lifetime: {
    name: "Lifetime Mortgage",
    shortName: "Lifetime",
    interestRate: 0.065,
    description: "No monthly payments required, interest rolls up",
    color: CHART_COLORS.lifetime,
    monthlyPaymentType: "optional",
    loanGrowth: "increases",
  },
  homeReversion: {
    name: "Home Reversion",
    shortName: "Reversion",
    interestRate: 0,
    description: "Sell part of home, no loan balance",
    color: CHART_COLORS.homeReversion,
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

// Generate projections for a single applicant
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

// Generate projections for combined household (multiple applicants)
export function generateHouseholdProjections(
  applicants: ApplicantData[],
  property: PropertyData,
  mortgageType: MortgageType,
  years: number = 40
): ProjectionData[] {
  const config = MORTGAGE_CONFIGS[mortgageType]
  // Use youngest applicant's age for display (more conservative for "years to retirement")
  const primaryApplicant = applicants.reduce((youngest, current) => {
    return calculateAge(current.dateOfBirth) < calculateAge(youngest.dateOfBirth) ? current : youngest
  }, applicants[0])
  
  const startAge = calculateAge(primaryApplicant.dateOfBirth)
  const propertyGrowthRate = 0.03 // 3% annual property appreciation
  const inflationRate = 0.025 // 2.5% income growth

  const projections: ProjectionData[] = []

  let loanBalance = property.loanAmount
  let propertyValue = property.propertyValue

  // Calculate home reversion share sold
  const sharePercentSold = mortgageType === "homeReversion" 
    ? (property.loanAmount / property.propertyValue) * 1.5
    : 0

  for (let year = 0; year <= years; year++) {
    // Calculate combined household income for this year
    let totalIncome = 0
    
    for (const applicant of applicants) {
      const applicantAge = calculateAge(applicant.dateOfBirth) + year
      const isRetired = applicantAge >= applicant.plannedRetirementAge
      
      if (isRetired) {
        // Pension income (doesn't grow with inflation for simplicity)
        totalIncome += applicant.statePension + applicant.otherPension
      } else {
        // Working income grows with inflation
        totalIncome += applicant.annualIncome * Math.pow(1 + inflationRate, year)
      }
    }

    const age = startAge + year

    // Property value grows
    propertyValue = property.propertyValue * Math.pow(1 + propertyGrowthRate, year)

    // Calculate monthly payment and loan balance based on mortgage type
    let monthlyPayment = 0

    switch (mortgageType) {
      case "retirement":
        // Capital and interest payments reduce balance over a 25-year term
        const termYears = 25
        const monthlyRate = config.interestRate / 12
        const numPayments = termYears * 12
        // Standard amortization formula
        monthlyPayment = (property.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1)
        if (year > 0 && year <= termYears) {
          // Simplified: balance reduces linearly over term
          loanBalance = property.loanAmount * (1 - year / termYears)
        } else if (year > termYears) {
          loanBalance = 0
          monthlyPayment = 0
        }
        break

      case "rio":
        // Interest-only payments, balance stays same
        monthlyPayment = (property.loanAmount * config.interestRate) / 12
        loanBalance = property.loanAmount // Balance stays constant
        break

      case "lifetime":
        // Interest rolls up, no required payments
        monthlyPayment = 0
        if (year === 0) {
          loanBalance = property.loanAmount
        } else {
          loanBalance = property.loanAmount * Math.pow(1 + config.interestRate, year)
        }
        break

      case "homeReversion":
        // No loan, just reduced equity ownership
        monthlyPayment = 0
        loanBalance = 0
        break
    }

    // Calculate equity
    let equity: number
    if (mortgageType === "homeReversion") {
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
      income: Math.round(totalIncome),
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
