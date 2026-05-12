"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  type MortgageType,
  MORTGAGE_CONFIGS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { Check, X, Minus } from "lucide-react"

interface ComparisonTableProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
}

interface Feature {
  label: string
  key: string
  getValue: (type: MortgageType, data: ProjectionData) => React.ReactNode
}

export function ComparisonTable({ projections, selectedYear }: ComparisonTableProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

  const features: Feature[] = [
    {
      label: "Minimum Age",
      key: "minAge",
      getValue: (type) => (type === "homeReversion" ? "70+" : "50+"),
    },
    {
      label: "Home Ownership",
      key: "ownership",
      getValue: (type) =>
        type === "homeReversion" ? (
          <Badge variant="secondary" className="text-xs">
            Sell part/all
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-green-600 text-green-600">
            Keep 100%
          </Badge>
        ),
    },
    {
      label: "Monthly Payments",
      key: "payments",
      getValue: (type, data) => {
        const config = MORTGAGE_CONFIGS[type]
        if (config.monthlyPaymentType === "none") {
          return (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" /> None required
            </span>
          )
        }
        if (config.monthlyPaymentType === "optional") {
          return (
            <span className="flex items-center gap-1 text-amber-600">
              <Minus className="h-4 w-4" /> Optional
            </span>
          )
        }
        return formatCurrency(data.monthlyPayment)
      },
    },
    {
      label: "Loan Balance at Year " + selectedYear,
      key: "balance",
      getValue: (_, data) => formatCurrency(data.loanBalance),
    },
    {
      label: "Equity at Year " + selectedYear,
      key: "equity",
      getValue: (_, data) => (
        <span className="font-semibold text-foreground">{formatCurrency(data.equity)}</span>
      ),
    },
    {
      label: "Proof of Income",
      key: "proof",
      getValue: (type) =>
        type === "lifetime" || type === "homeReversion" ? (
          <span className="flex items-center gap-1 text-green-600">
            <X className="h-4 w-4" /> Not required
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Check className="h-4 w-4" /> Required
          </span>
        ),
    },
    {
      label: "Loan Balance Trend",
      key: "trend",
      getValue: (type) => {
        const config = MORTGAGE_CONFIGS[type]
        const colors = {
          decreases: "bg-green-100 text-green-700",
          stable: "bg-blue-100 text-blue-700",
          increases: "bg-amber-100 text-amber-700",
          fixed: "bg-gray-100 text-gray-700",
        }
        const labels = {
          decreases: "Reduces over time",
          stable: "Stays level",
          increases: "Increases (roll-up)",
          fixed: "Fixed (no loan)",
        }
        return (
          <Badge variant="secondary" className={`text-xs ${colors[config.loanGrowth]}`}>
            {labels[config.loanGrowth]}
          </Badge>
        )
      },
    },
    {
      label: "Length of Plan",
      key: "length",
      getValue: (type) =>
        type === "retirement" ? "Fixed term" : "For life",
    },
    {
      label: "Repayment Trigger",
      key: "trigger",
      getValue: (type) =>
        type === "retirement"
          ? "End of term"
          : "Death or long-term care",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Comparison</CardTitle>
        <CardDescription>
          Side-by-side feature comparison for all mortgage types at Year {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Feature</TableHead>
                {mortgageTypes.map((type) => (
                  <TableHead key={type} className="text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MORTGAGE_CONFIGS[type].color }}
                      />
                      <span>{MORTGAGE_CONFIGS[type].shortName}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.key}>
                  <TableCell className="font-medium text-muted-foreground">
                    {feature.label}
                  </TableCell>
                  {mortgageTypes.map((type) => (
                    <TableCell key={type} className="text-center">
                      {feature.getValue(type, projections[type][selectedYear])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
