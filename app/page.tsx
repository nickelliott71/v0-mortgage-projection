"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"
import type { ApplicantData, PropertyData } from "@/lib/mortgage-calculations"

const defaultApplicant: ApplicantData = {
  dateOfBirth: { day: 1, month: 1, year: 1960 },
  gender: "female",
  employmentStatus: "working",
  plannedRetirementAge: 67,
  annualIncome: 30000,
  statePension: 11973,
  otherPension: 0,
}

export default function DataEntryPage() {
  const router = useRouter()
  const [numberOfApplicants, setNumberOfApplicants] = useState(2)
  const [applicants, setApplicants] = useState<ApplicantData[]>([
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
  ])
  const [property, setProperty] = useState<PropertyData>({
    propertyValue: 500000,
    loanAmount: 100000,
  })

  const handleNumberOfApplicantsChange = (num: number) => {
    setNumberOfApplicants(num)
    if (num > applicants.length) {
      const newApplicants = [...applicants]
      for (let i = applicants.length; i < num; i++) {
        newApplicants.push({ ...defaultApplicant })
      }
      setApplicants(newApplicants)
    } else if (num < applicants.length) {
      setApplicants(applicants.slice(0, num))
    }
  }

  const updateApplicant = (index: number, field: keyof ApplicantData, value: unknown) => {
    const newApplicants = [...applicants]
    newApplicants[index] = { ...newApplicants[index], [field]: value }
    setApplicants(newApplicants)
  }

  const updateDateOfBirth = (
    index: number,
    field: "day" | "month" | "year",
    value: number
  ) => {
    const newApplicants = [...applicants]
    newApplicants[index] = {
      ...newApplicants[index],
      dateOfBirth: { ...newApplicants[index].dateOfBirth, [field]: value },
    }
    setApplicants(newApplicants)
  }

  const handleSubmit = () => {
    // Store data in sessionStorage and navigate to projection page
    const data = {
      applicants: applicants.slice(0, numberOfApplicants),
      property,
    }
    sessionStorage.setItem("mortgageData", JSON.stringify(data))
    router.push("/projection")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Later Life Mortgage Comparison</h1>
              <p className="text-sm text-muted-foreground">40-Year Projection Tool</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="gap-4 py-6">
          <CardContent className="space-y-8">
            {/* Applicants & Income Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Applicants & income</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="text-destructive">*</span> mandatory fields
                </p>
              </div>

              {/* Number of Applicants */}
              <div className="mb-8">
                <Label className="text-sm font-medium mb-2 block">
                  <span className="text-destructive">*</span> Number of applicants
                </Label>
                <div className="flex">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberOfApplicantsChange(num)}
                      className={`flex-1 py-3 px-6 text-center border transition-colors ${
                        num === 1 ? "rounded-l-md" : ""
                      } ${num === 4 ? "rounded-r-md" : ""} ${
                        numberOfApplicants === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applicant Forms */}
              <div className={`grid gap-8 ${numberOfApplicants > 1 ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md"}`}>
                {applicants.slice(0, numberOfApplicants).map((applicant, index) => (
                  <div key={index} className="space-y-5">
                    <h3 className="text-xl font-semibold text-foreground">
                      Applicant {index + 1}
                    </h3>

                    {/* Date of Birth */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Date of birth
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Day</Label>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={applicant.dateOfBirth.day}
                            onChange={(e) =>
                              updateDateOfBirth(index, "day", parseInt(e.target.value) || 1)
                            }
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Month</Label>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            value={applicant.dateOfBirth.month}
                            onChange={(e) =>
                              updateDateOfBirth(index, "month", parseInt(e.target.value) || 1)
                            }
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
                          <Input
                            type="number"
                            min={1930}
                            max={2010}
                            value={applicant.dateOfBirth.year}
                            onChange={(e) =>
                              updateDateOfBirth(index, "year", parseInt(e.target.value) || 1960)
                            }
                            className="text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Gender
                      </Label>
                      <Select
                        value={applicant.gender}
                        onValueChange={(value: "male" | "female") =>
                          updateApplicant(index, "gender", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Employment Status */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Employment status
                      </Label>
                      <div className="flex">
                        <button
                          onClick={() => updateApplicant(index, "employmentStatus", "working")}
                          className={`flex-1 py-2.5 px-4 text-center border rounded-l-md transition-colors ${
                            applicant.employmentStatus === "working"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          Working
                        </button>
                        <button
                          onClick={() => updateApplicant(index, "employmentStatus", "retired")}
                          className={`flex-1 py-2.5 px-4 text-center border-t border-b border-r rounded-r-md transition-colors ${
                            applicant.employmentStatus === "retired"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          Retired
                        </button>
                      </div>
                    </div>

                    {/* Planned Retirement Age */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Planned retirement age
                      </Label>
                      <Input
                        type="number"
                        min={50}
                        max={85}
                        value={applicant.plannedRetirementAge}
                        onChange={(e) =>
                          updateApplicant(index, "plannedRetirementAge", parseInt(e.target.value) || 67)
                        }
                      />
                    </div>

                    {/* Annual Income */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Annual income (before tax)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min={0}
                          value={applicant.annualIncome}
                          onChange={(e) =>
                            updateApplicant(index, "annualIncome", parseInt(e.target.value) || 0)
                          }
                          className="pl-7"
                        />
                      </div>
                    </div>

                    {/* State Pension */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> State pension (annual)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min={0}
                          value={applicant.statePension}
                          onChange={(e) =>
                            updateApplicant(index, "statePension", parseInt(e.target.value) || 0)
                          }
                          className="pl-7"
                        />
                      </div>
                    </div>

                    {/* Other Pension */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        <span className="text-destructive">*</span> Other pension income (annual)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min={0}
                          value={applicant.otherPension}
                          onChange={(e) =>
                            updateApplicant(index, "otherPension", parseInt(e.target.value) || 0)
                          }
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Section */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6">Property</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Property Value */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <span className="text-destructive">*</span> Property value
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min={50000}
                      value={property.propertyValue}
                      onChange={(e) =>
                        setProperty({ ...property, propertyValue: parseInt(e.target.value) || 0 })
                      }
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* Loan Amount */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <span className="text-destructive">*</span> Loan amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min={10000}
                      max={property.propertyValue * 0.6}
                      value={property.loanAmount}
                      onChange={(e) =>
                        setProperty({ ...property, loanAmount: parseInt(e.target.value) || 0 })
                      }
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                size="lg" 
                onClick={handleSubmit}
                className="px-8"
              >
                Generate projection
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
