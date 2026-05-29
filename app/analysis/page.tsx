"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  generateHouseholdProjections,
  calculateAge,
} from "@/lib/mortgage-calculations"
import { ANALYSIS_MORTGAGE_CONFIGS } from "@/lib/analysis-config"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

// Default data for analysis page (independent from main projection page)
const defaultApplicants: ApplicantData[] = [
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

const defaultProperty: PropertyData = {
  propertyValue: 500000,
  loanAmount: 100000,
}

export default function AnalysisPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState(10)
  const [applicants, setApplicants] = useState<ApplicantData[]>(defaultApplicants)
  const [property, setProperty] = useState<PropertyData>(defaultProperty)
  const [lifetimeOptionalPayment, setLifetimeOptionalPayment] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const maxYears = 40

  // Load data from sessionStorage on mount - uses separate key from main projection page
  useEffect(() => {
    const storedData = sessionStorage.getItem("analysisPageData")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.applicants && parsed.applicants.length > 0) {
          setApplicants(parsed.applicants)
        }
        if (parsed.property) {
          setProperty(parsed.property)
        }
        if (typeof parsed.lifetimeOptionalPayment === "number") {
          setLifetimeOptionalPayment(parsed.lifetimeOptionalPayment)
        }
      } catch {
        // Use default data if parsing fails
      }
    }
    setIsLoaded(true)
  }, [])

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("analysisPageData", JSON.stringify({
        applicants,
        property,
        lifetimeOptionalPayment,
      }))
    }
  }, [applicants, property, lifetimeOptionalPayment, isLoaded])

  // Handle applicant updates
  const handleApplicantChange = useCallback((index: number, updates: Partial<ApplicantData>) => {
    setApplicants(prev => {
      const newApplicants = [...prev]
      newApplicants[index] = { ...newApplicants[index], ...updates }
      return newApplicants
    })
  }, [])

  // Handle property updates
  const handlePropertyChange = useCallback((updates: Partial<PropertyData>) => {
    setProperty(prev => ({ ...prev, ...updates }))
  }, [])

  // Use youngest applicant for age display (most conservative)
  const youngestApplicant = useMemo(() => {
    return applicants.reduce((youngest, current) => {
      return calculateAge(current.dateOfBirth) < calculateAge(youngest.dateOfBirth) ? current : youngest
    }, applicants[0])
  }, [applicants])
  
  const currentAge = calculateAge(youngestApplicant.dateOfBirth)

  // Find earliest retirement age among all applicants
  const earliestRetirementAge = useMemo(() => {
    return Math.min(...applicants.map(a => a.plannedRetirementAge))
  }, [applicants])

  // Generate projections for all mortgage types using combined household income
  const projections = useMemo(() => {
    const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]
    const result: Record<MortgageType, ReturnType<typeof generateHouseholdProjections>> = {
      retirement: [],
      rio: [],
      lifetime: [],
      homeReversion: [],
    }

    mortgageTypes.forEach((type) => {
      const optionalPayment = type === "lifetime" ? lifetimeOptionalPayment : 0
      result[type] = generateHouseholdProjections(applicants, property, type, maxYears, optionalPayment)
    })

    return result
  }, [applicants, property, lifetimeOptionalPayment])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

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
                <h1 className="text-xl font-bold text-foreground">Mortgage analysis</h1>
                <p className="text-sm text-muted-foreground">40-year projection workspace</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Applicant Summary with Editable Controls */}
        <ApplicantSummary 
          applicants={applicants} 
          property={property}
          onApplicantChange={handleApplicantChange}
          onPropertyChange={handlePropertyChange}
        />

        {/* Year Selector */}
        <YearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          maxYears={maxYears}
          applicantAges={applicants.map(a => calculateAge(a.dateOfBirth))}
        />

        {/* Summary Cards */}
        <SummaryCards 
          projections={projections} 
          selectedYear={selectedYear} 
          lifetimeOptionalPayment={lifetimeOptionalPayment}
          onLifetimePaymentChange={setLifetimeOptionalPayment}
          mortgageConfigs={ANALYSIS_MORTGAGE_CONFIGS}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Main Projection Chart */}
          <div className="xl:col-span-2">
            <ProjectionChart
              projections={projections}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              applicants={applicants}
              mortgageConfigs={ANALYSIS_MORTGAGE_CONFIGS}
            />
          </div>

          {/* Income vs Payments */}
          <div className="xl:col-span-2">
            <IncomeProjection
              projections={projections}
              selectedYear={selectedYear}
              retirementAge={earliestRetirementAge}
              currentAge={currentAge}
              applicants={applicants}
              mortgageConfigs={ANALYSIS_MORTGAGE_CONFIGS}
            />
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <ComparisonTable projections={projections} selectedYear={selectedYear} mortgageConfigs={ANALYSIS_MORTGAGE_CONFIGS} />

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border mt-8">
          <p>
            Projections are illustrative and based on assumed growth rates. Property values
            assume 3% annual appreciation. Income grows at 2.5% until retirement.
          </p>
          <p className="mt-2">
            For professional broker use only. Not financial advice.
          </p>
        </footer>
      </main>
    </div>
  )
}
