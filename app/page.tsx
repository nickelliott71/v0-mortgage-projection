"use client"

import { useState, useMemo } from "react"
import { SummaryCards } from "@/components/mortgage/summary-cards"
import { ProjectionChart } from "@/components/mortgage/projection-chart"
import { ComparisonTable } from "@/components/mortgage/comparison-table"
import { YearSelector } from "@/components/mortgage/year-selector"
import { IncomeProjection } from "@/components/mortgage/income-projection"
import { ApplicantSummary } from "@/components/mortgage/applicant-summary"
import {
  type ApplicantData,
  type PropertyData,
  type MortgageType,
  generateProjections,
  calculateAge,
} from "@/lib/mortgage-calculations"
import { Building2, TrendingUp, FileText } from "lucide-react"

// Sample data from the form (matching the provided screenshot)
const sampleApplicants: ApplicantData[] = [
  {
    dateOfBirth: { day: 7, month: 6, year: 1961 },
    gender: "female",
    employmentStatus: "working",
    plannedRetirementAge: 67,
    annualIncome: 50000,
    statePension: 11973,
    otherPension: 10000,
  },
  {
    dateOfBirth: { day: 12, month: 11, year: 1968 },
    gender: "male",
    employmentStatus: "working",
    plannedRetirementAge: 67,
    annualIncome: 25000,
    statePension: 11973,
    otherPension: 0,
  },
]

const sampleProperty: PropertyData = {
  propertyValue: 500000,
  loanAmount: 100000,
}

export default function MortgageProjectionPage() {
  const [selectedYear, setSelectedYear] = useState(10)
  const maxYears = 40

  // Use primary applicant for projections
  const primaryApplicant = sampleApplicants[0]
  const currentAge = calculateAge(primaryApplicant.dateOfBirth)

  // Generate projections for all mortgage types
  const projections = useMemo(() => {
    const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]
    const result: Record<MortgageType, ReturnType<typeof generateProjections>> = {
      retirement: [],
      rio: [],
      lifetime: [],
      homeReversion: [],
    }

    mortgageTypes.forEach((type) => {
      result[type] = generateProjections(primaryApplicant, sampleProperty, type, maxYears)
    })

    return result
  }, [primaryApplicant])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Later Life Mortgage Comparison</h1>
                <p className="text-sm text-muted-foreground">40-Year Projection Dashboard</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Compare 4 UK mortgage types</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>For brokers</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Applicant Summary */}
        <ApplicantSummary applicants={sampleApplicants} property={sampleProperty} />

        {/* Year Selector */}
        <YearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          maxYears={maxYears}
          currentAge={currentAge}
        />

        {/* Summary Cards */}
        <SummaryCards projections={projections} selectedYear={selectedYear} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Main Projection Chart */}
          <div className="xl:col-span-2">
            <ProjectionChart
              projections={projections}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          </div>

          {/* Income vs Payments */}
          <div className="xl:col-span-2">
            <IncomeProjection
              projections={projections}
              selectedYear={selectedYear}
              retirementAge={primaryApplicant.plannedRetirementAge}
              currentAge={currentAge}
            />
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <ComparisonTable projections={projections} selectedYear={selectedYear} />

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border mt-8">
          <p>
            Projections are illustrative and based on assumed growth rates. Property values
            assume 3% annual appreciation. Actual results may vary.
          </p>
          <p className="mt-2">
            For professional broker use only. Not financial advice.
          </p>
        </footer>
      </main>
    </div>
  )
}
