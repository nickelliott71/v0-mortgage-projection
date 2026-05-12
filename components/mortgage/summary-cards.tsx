"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  type MortgageType,
  MORTGAGE_CONFIGS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { TrendingUp, TrendingDown, Home, Wallet } from "lucide-react"

interface SummaryCardsProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
}

export function SummaryCards({ projections, selectedYear }: SummaryCardsProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {mortgageTypes.map((type) => {
        const config = MORTGAGE_CONFIGS[type]
        const data = projections[type][selectedYear]
        const startData = projections[type][0]
        const equityChange = data.equity - startData.equity
        const equityPercent = ((equityChange / startData.equity) * 100).toFixed(1)

        return (
          <Card key={type} className="relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: config.color }}
            />
            <CardContent className="pt-3 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {config.shortName}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(data.equity)}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Home className="h-4 w-4" style={{ color: config.color }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Equity at Year {selectedYear}</span>
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      equityChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {equityChange >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {equityChange >= 0 ? "+" : ""}
                    {equityPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Loan Balance</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(data.loanBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Payment</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-muted-foreground" />
                    {data.monthlyPayment > 0
                      ? formatCurrency(data.monthlyPayment)
                      : "None"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
