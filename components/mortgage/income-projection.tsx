"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  type MortgageType,
  MORTGAGE_CONFIGS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ComposedChart,
  Bar,
} from "recharts"

interface IncomeProjectionProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
  retirementAge: number
  currentAge: number
}

export function IncomeProjection({
  projections,
  selectedYear,
  retirementAge,
  currentAge,
}: IncomeProjectionProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

  // Create data combining income with monthly payments for each mortgage type
  const combinedData = projections.retirement.map((data, index) => {
    const baseData: Record<string, number> = {
      year: data.year,
      age: data.age,
      income: data.income,
    }

    mortgageTypes.forEach((type) => {
      baseData[`${type}Payment`] = projections[type][index].monthlyPayment * 12 // Annual
    })

    // Calculate net income (income minus payments) for each type
    mortgageTypes.forEach((type) => {
      baseData[`${type}NetIncome`] =
        data.income - projections[type][index].monthlyPayment * 12
    })

    return baseData
  })

  const retirementYear = Math.max(0, retirementAge - currentAge)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const incomeItem = payload.find((p) => p.dataKey === "income")
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">Year {label}</p>
          {incomeItem && (
            <div className="flex items-center gap-2 text-sm mb-2 pb-2 border-b border-border">
              <span className="text-muted-foreground">Gross Income:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(incomeItem.value)}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-1">Annual Payments:</p>
          {payload
            .filter((p) => p.dataKey.includes("Payment"))
            .map((entry, index) => {
              const typeName = entry.dataKey.replace("Payment", "")
              const config = MORTGAGE_CONFIGS[typeName as MortgageType]
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-muted-foreground">{config.shortName}:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              )
            })}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Monthly Payments</CardTitle>
        <CardDescription>
          See how mortgage payments impact your annual income over time. The dashed line shows
          retirement age.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="year"
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `Y${value}`}
              />
              <YAxis
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Retirement reference line */}
              {retirementYear > 0 && retirementYear <= 40 && (
                <ReferenceLine
                  x={retirementYear}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: "Retirement",
                    position: "top",
                    fill: "hsl(var(--destructive))",
                    fontSize: 11,
                  }}
                />
              )}

              {/* Selected year indicator */}
              <ReferenceLine
                x={selectedYear}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              {/* Income area */}
              <Area
                type="monotone"
                dataKey="income"
                name="Gross Income"
                stroke="hsl(var(--primary))"
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />

              {/* Payment bars for each mortgage type */}
              {mortgageTypes.map((type) => (
                <Bar
                  key={type}
                  dataKey={`${type}Payment`}
                  name={`${MORTGAGE_CONFIGS[type].shortName} Payments`}
                  fill={MORTGAGE_CONFIGS[type].color}
                  opacity={0.7}
                  barSize={8}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
          {mortgageTypes.map((type) => {
            const data = projections[type][selectedYear]
            const annualPayment = data.monthlyPayment * 12
            const paymentRatio =
              data.income > 0 ? ((annualPayment / data.income) * 100).toFixed(1) : "0"

            return (
              <div key={type} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: MORTGAGE_CONFIGS[type].color }}
                />
                <p className="text-xs text-muted-foreground">
                  {MORTGAGE_CONFIGS[type].shortName}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {paymentRatio}%
                </p>
                <p className="text-xs text-muted-foreground">of income</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
