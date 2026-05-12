"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  type ApplicantData,
  type PropertyData,
  calculateAge,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { User, Home, Briefcase, Calendar, PoundSterling, Pencil } from "lucide-react"

interface ApplicantSummaryProps {
  applicants: ApplicantData[]
  property: PropertyData
  onEdit?: () => void
}

export function ApplicantSummary({
  applicants,
  property,
  onEdit,
}: ApplicantSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Application Summary</CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Applicants */}
          {applicants.map((applicant, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Applicant {index + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {applicant.gender === "male" ? "Male" : "Female"} •{" "}
                    Age {calculateAge(applicant.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Status
                  </span>
                  <Badge variant={applicant.employmentStatus === "working" ? "default" : "secondary"}>
                    {applicant.employmentStatus === "working" ? "Working" : "Retired"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Retirement
                  </span>
                  <span className="font-medium text-foreground">Age {applicant.plannedRetirementAge}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" />
                    Income
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
              </div>
            </div>
          ))}

          {/* Property */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Property</p>
                <p className="text-xs text-muted-foreground">Current Details</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Property Value</span>
                <span className="font-semibold text-foreground text-base">
                  {formatCurrency(property.propertyValue)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="font-semibold text-foreground text-base">
                  {formatCurrency(property.loanAmount)}
                </span>
              </div>

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
