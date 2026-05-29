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
  type MortgageConfig,
  MORTGAGE_CONFIGS,
  ACCESSIBILITY_PATTERNS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { Check, X, Minus } from "lucide-react"

interface ComparisonTableProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
  mortgageConfigs?: Record<MortgageType, MortgageConfig>
}

interface Feature {
  label: string
  key: string
  getValue: (type: MortgageType, data: ProjectionData, configs: Record<MortgageType, MortgageConfig>) => React.ReactNode
}

export function ComparisonTable({ projections, selectedYear, mortgageConfigs = MORTGAGE_CONFIGS }: ComparisonTableProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

  // Helper to render shape indicator for accessibility
  const renderShapeIndicator = (type: MortgageType, size: number = 12) => {
    const pattern = ACCESSIBILITY_PATTERNS[type]
    const color = mortgageConfigs[type].color
    
    switch (pattern.markerShape) {
      case 'circle':
        return (
          <svg width={size} height={size} className="flex-shrink-0">
            <circle cx={size/2} cy={size/2} r={size/2 - 1} fill={color} />
          </svg>
        )
      case 'square':
        return (
          <svg width={size} height={size} className="flex-shrink-0">
            <rect x={1} y={1} width={size - 2} height={size - 2} fill={color} />
          </svg>
        )
      case 'triangle':
        return (
          <svg width={size} height={size} className="flex-shrink-0">
            <polygon points={`${size/2},1 ${size - 1},${size - 1} 1,${size - 1}`} fill={color} />
          </svg>
        )
      case 'diamond':
        return (
          <svg width={size} height={size} className="flex-shrink-0">
            <polygon points={`${size/2},0 ${size},${size/2} ${size/2},${size} 0,${size/2}`} fill={color} />
          </svg>
        )
      default:
        return <div className="rounded-full flex-shrink-0" style={{ backgroundColor: color, width: size, height: size }} />
    }
  }

  const features: Feature[] = [
    {
      label: "Minimum age",
      key: "minAge",
      getValue: (type) => (type === "homeReversion" ? "70+" : "50+"),
    },
    {
      label: "Home ownership",
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
      label: "Monthly payments",
      key: "payments",
      getValue: (type, data, configs) => {
        const config = configs[type]
        if (config.monthlyPaymentType === "none") {
          return (
            <span className="inline-flex items-center justify-center gap-1 text-green-600">
              <Check className="h-4 w-4 flex-shrink-0" /> None required
            </span>
          )
        }
        if (config.monthlyPaymentType === "optional") {
          return (
            <span className="inline-flex items-center justify-center gap-1 text-amber-600">
              <Minus className="h-4 w-4 flex-shrink-0" /> Optional
            </span>
          )
        }
        return formatCurrency(data.monthlyPayment)
      },
    },
    {
      label: "Loan balance at year " + selectedYear,
      key: "balance",
      getValue: (_, data) => formatCurrency(data.loanBalance),
    },
    {
      label: "Equity at year " + selectedYear,
      key: "equity",
      getValue: (_, data) => (
        <span className="font-semibold text-foreground">{formatCurrency(data.equity)}</span>
      ),
    },
    {
      label: "Proof of income",
      key: "proof",
      getValue: (type) =>
        type === "lifetime" || type === "homeReversion" ? (
          <span className="inline-flex items-center justify-center gap-1 text-green-600">
            <X className="h-4 w-4 flex-shrink-0" /> Not required
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1 text-muted-foreground">
            <Check className="h-4 w-4 flex-shrink-0" /> Required
          </span>
        ),
    },
    {
      label: "Loan balance trend",
      key: "trend",
      getValue: (type, data, configs) => {
        const config = configs[type]
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
      label: "Length of plan",
      key: "length",
      getValue: (type) =>
        type === "retirement" ? "Fixed term" : "For life",
    },
    {
      label: "Repayment trigger",
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
        <CardTitle>Detailed comparison</CardTitle>
        <CardDescription>
          Side-by-side feature comparison for all mortgage types at year {selectedYear}
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
                      {renderShapeIndicator(type, 12)}
                      <span>{mortgageConfigs[type].shortName}</span>
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
                      {feature.getValue(type, projections[type][selectedYear], mortgageConfigs)}
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
