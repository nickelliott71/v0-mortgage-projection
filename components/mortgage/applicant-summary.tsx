"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  type ApplicantData,
  type PropertyData,
  calculateAge,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { User, Home, Briefcase, Calendar, PoundSterling } from "lucide-react"

interface ApplicantSummaryProps {
  applicants: ApplicantData[]
  property: PropertyData
  onApplicantChange?: (index: number, updates: Partial<ApplicantData>) => void
  onPropertyChange?: (updates: Partial<PropertyData>) => void
}

export function ApplicantSummary({
  applicants,
  property,
  onApplicantChange,
  onPropertyChange,
}: ApplicantSummaryProps) {
  const isEditable = !!onApplicantChange && !!onPropertyChange

  return (
    <Card className="gap-2 py-4">
      <CardHeader>
        <CardTitle className="text-lg">Application Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Applicants */}
          {applicants.map((applicant, index) => {
            const currentAge = calculateAge(applicant.dateOfBirth)
            const yearsToRetirement = applicant.plannedRetirementAge - currentAge

            return (
              <div key={index} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Applicant {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {applicant.gender === "male" ? "Male" : "Female"} • Age {currentAge}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Status
                    </span>
                    <Badge variant={applicant.employmentStatus === "working" ? "default" : "secondary"}>
                      {applicant.employmentStatus === "working" ? "Working" : "Retired"}
                    </Badge>
                  </div>

                  {/* Editable Retirement Age */}
                  {isEditable ? (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Retirement Age
                        </Label>
                        <span className="text-sm font-semibold text-primary">
                          {applicant.plannedRetirementAge}
                        </span>
                      </div>
                      <Slider
                        value={[applicant.plannedRetirementAge]}
                        onValueChange={([value]) =>
                          onApplicantChange(index, { plannedRetirementAge: value })
                        }
                        min={Math.max(50, currentAge)}
                        max={85}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        {yearsToRetirement > 0
                          ? `${yearsToRetirement} years until retirement`
                          : "Already retired"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Retirement
                      </span>
                      <span className="font-medium text-foreground">
                        Age {applicant.plannedRetirementAge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <PoundSterling className="h-3 w-3" />
                      Current Income
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(applicant.annualIncome)}/yr
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">State Pension</span>
                    <span className="text-foreground">{formatCurrency(applicant.statePension)}/yr</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Other Pension</span>
                    <span className="text-foreground">{formatCurrency(applicant.otherPension)}/yr</span>
                  </div>

                  {/* Retirement Income Summary */}
                  <div className="pt-2 mt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Retirement Income</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(applicant.statePension + applicant.otherPension)}/yr
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Property */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Property & Loan</p>
                <p className="text-xs text-muted-foreground">Adjust loan amount</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Property Value</span>
                <span className="font-semibold text-foreground text-base">
                  {formatCurrency(property.propertyValue)}
                </span>
              </div>

              {/* Editable Loan Amount */}
              {isEditable ? (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Loan Amount
                    </Label>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(property.loanAmount)}
                    </span>
                  </div>
                  <Slider
                    value={[property.loanAmount]}
                    onValueChange={([value]) =>
                      onPropertyChange({ loanAmount: value })
                    }
                    min={25000}
                    max={Math.min(property.propertyValue * 0.6, 500000)}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>£25k</span>
                    <span>{formatCurrency(Math.min(property.propertyValue * 0.6, 500000))}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-semibold text-foreground text-base">
                    {formatCurrency(property.loanAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Equity</span>
                <span className="font-semibold text-accent text-base">
                  {formatCurrency(property.propertyValue - property.loanAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">LTV Ratio</span>
                <Badge variant="outline">
                  {((property.loanAmount / property.propertyValue) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
