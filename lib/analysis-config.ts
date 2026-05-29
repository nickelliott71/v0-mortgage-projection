import { type MortgageType, type MortgageConfig, CHART_COLORS } from "./mortgage-calculations"

// Custom labels for the analysis page
// Just (1) = Interest Roll-Up Lifetime Mortgage (no payments, interest compounds)
// Just (2) = Interest Serviced Lifetime Mortgage (with £100/month optional payment)
export const ANALYSIS_MORTGAGE_CONFIGS: Record<MortgageType, MortgageConfig> = {
  retirement: {
    name: "Skipton Mortgage",
    shortName: "Skipton",
    interestRate: 0.055,
    description: "Fixed term, interest-only or capital & interest payments",
    color: CHART_COLORS.retirement,
    monthlyPaymentType: "capital-interest",
    loanGrowth: "decreases",
  },
  rio: {
    name: "Scottish Mortgage",
    shortName: "Scottish",
    interestRate: 0.052,
    description: "Interest-only payments required, for life",
    color: CHART_COLORS.rio,
    monthlyPaymentType: "interest-only",
    loanGrowth: "stable",
  },
  lifetime: {
    name: "Just (1) - Interest Roll-Up",
    shortName: "Just (1)",
    interestRate: 0.065,
    description: "Interest Roll-Up Lifetime Mortgage with £100/month optional payment",
    color: CHART_COLORS.lifetime,
    monthlyPaymentType: "optional",
    loanGrowth: "increases",
  },
  homeReversion: {
    name: "Just (2) - Interest Serviced",
    shortName: "Just (2)",
    interestRate: 0.065,
    description: "Interest Serviced Lifetime Mortgage with £100/month optional payment",
    color: CHART_COLORS.homeReversion,
    monthlyPaymentType: "optional",
    loanGrowth: "stable",
  },
}

// Fixed optional payment for Just mortgages on analysis page
export const JUST_OPTIONAL_PAYMENT = 100
