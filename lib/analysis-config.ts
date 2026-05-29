import { type MortgageType, type MortgageConfig, CHART_COLORS } from "./mortgage-calculations"

// Custom labels for the analysis page
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
    name: "Just (1) Mortgage",
    shortName: "Just (1)",
    interestRate: 0.065,
    description: "No monthly payments required, interest rolls up",
    color: CHART_COLORS.lifetime,
    monthlyPaymentType: "optional",
    loanGrowth: "increases",
  },
  homeReversion: {
    name: "Just (2) Mortgage",
    shortName: "Just (2)",
    interestRate: 0,
    description: "Sell part of home, no loan balance",
    color: CHART_COLORS.homeReversion,
    monthlyPaymentType: "none",
    loanGrowth: "fixed",
  },
}
