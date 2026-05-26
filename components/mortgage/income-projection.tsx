"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  type MortgageType,
  type ApplicantData,
  MORTGAGE_CONFIGS,
  CHART_COLORS,
  ACCESSIBILITY_PATTERNS,
  type ProjectionData,
  formatCurrency,
  calculateAge,
  yearToScaledPosition,
  getScaledXAxisTicks,
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
  applicants?: ApplicantData[]
}

export function IncomeProjection({
  projections,
  selectedYear,
  retirementAge,
  currentAge,
  applicants = [],
}: IncomeProjectionProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]
  // Chart excludes homeReversion as it has age eligibility requirements
  const chartMortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime"]

  // Helper to render shape indicator for accessibility
  const renderShapeIndicator = (type: MortgageType, color: string, size: number = 12) => {
    const pattern = ACCESSIBILITY_PATTERNS[type]
    
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

  // Get scaled x-axis ticks
  const scaledTicks = getScaledXAxisTicks()

  // Calculate current ages for each applicant
  const applicantCurrentAges = applicants.map(a => calculateAge(a.dateOfBirth))

  // Create data combining income with monthly payments for each mortgage type
  const combinedData = projections.retirement.map((data, index) => {
    const baseData: Record<string, number | number[]> = {
      year: data.year,
      scaledX: yearToScaledPosition(data.year),
      age: data.age,
      income: data.income,
      applicantAges: applicantCurrentAges.map(currentAge => currentAge + data.year),
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

  // Calculate retirement years for each applicant
  const retirementMarkers = applicants.map((applicant, index) => {
    const applicantAge = calculateAge(applicant.dateOfBirth)
    const yearsToRetirement = applicant.plannedRetirementAge - applicantAge
    return {
      year: yearsToRetirement,
      applicantIndex: index + 1,
      age: applicant.plannedRetirementAge,
    }
  }).filter(marker => marker.year > 0 && marker.year <= 40)
    .sort((a, b) => a.year - b.year)

  // Create display labels for above chart
  const retirementLabels: { title: string; years: number }[] = []
  
  if (retirementMarkers.length === 2 && retirementMarkers[0].year === retirementMarkers[1].year) {
    retirementLabels.push({ title: "Both retired", years: retirementMarkers[0].year })
  } else if (retirementMarkers.length >= 1) {
    retirementLabels.push({ title: "First retirement", years: retirementMarkers[0].year })
    if (retirementMarkers.length === 2) {
      retirementLabels.push({ title: "Both retired", years: retirementMarkers[1].year })
    }
  }

  // Unique years for reference lines (no labels on chart)
  const uniqueRetirementYears = [...new Set(retirementMarkers.map(m => m.year))]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string; payload: { year: number; applicantAges?: number[] } }> }) => {
    if (active && payload && payload.length) {
      const incomeItem = payload.find((p) => p.dataKey === "income")
      const year = payload[0]?.payload?.year
      const applicantAges = payload[0]?.payload?.applicantAges || []
      const yearData = combinedData.find(d => d.year === year)
      
      // Format ages display
      const agesDisplay = applicantAges.length > 0 
        ? applicantAges.length === 1 
          ? `Age ${applicantAges[0]}`
          : `Ages ${applicantAges[0]} & ${applicantAges[1]}`
        : yearData ? `Age ${yearData.age}` : ''
      
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">
            Year {year} {agesDisplay && `(${agesDisplay})`}
          </p>
          {incomeItem && (
            <div className="flex items-center gap-2 text-sm mb-2 pb-2 border-b border-border">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#059669" }} />
              <span className="text-muted-foreground">Household income:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(incomeItem.value)}/yr
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-1">Annual mortgage payments:</p>
          {payload
            .filter((p) => p.dataKey.includes("Payment") && !p.dataKey.includes("homeReversion"))
            .map((entry, index) => {
              const typeName = entry.dataKey.replace("Payment", "") as MortgageType
              const config = MORTGAGE_CONFIGS[typeName]
              const netIncome = yearData ? yearData[`${typeName}NetIncome`] : 0
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-sm py-0.5">
                  <div className="flex items-center gap-2">
                    {renderShapeIndicator(typeName, config.color, 12)}
                    <span className="text-muted-foreground">{config.shortName}:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">
                      {formatCurrency(entry.value)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (Net: {formatCurrency(netIncome as number)})
                    </span>
                  </div>
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
        <CardTitle>Household income vs. annual mortgage payments</CardTitle>
        <CardDescription>
          Combined household income from all applicants, with annual mortgage payments for each type. 
          Income transitions to pension income at each applicant&apos;s retirement age.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Retirement labels positioned above chart */}
          {retirementLabels.length > 0 && (
            <div className="relative h-10" style={{ marginLeft: 60, marginRight: 20 }}>
              {retirementLabels.map((label, index) => (
                <div 
                  key={index} 
                  className="absolute text-center -translate-x-1/2"
                  style={{ left: `${yearToScaledPosition(label.years)}%` }}
                >
                  <p className="text-xs font-medium" style={{ color: '#C50B30' }}>{label.title}</p>
                  <p className="text-xs" style={{ color: '#C50B30', opacity: 0.8 }}>In {label.years} {label.years === 1 ? 'year' : 'years'}</p>
                </div>
              ))}
            </div>
          )}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="scaledX"
                type="number"
                domain={[0, 100]}
                ticks={scaledTicks.map(t => t.value)}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => {
                  const tick = scaledTicks.find(t => Math.abs(t.value - value) < 0.1)
                  return tick?.label || ''
                }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
              />
              
              {/* Retirement reference lines */}
              {uniqueRetirementYears.map((year, index) => (
                <ReferenceLine
                  key={index}
                  x={yearToScaledPosition(year)}
                  stroke="#C50B30"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              ))}

              {/* Selected year indicator */}
              <ReferenceLine
                x={yearToScaledPosition(selectedYear)}
                stroke="#1e40af"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              {/* Income area */}
              <Area
                type="monotone"
                dataKey="income"
                name="Household income"
                stroke="#059669"
                fill="url(#incomeGradient)"
                strokeWidth={3}
              />

              {/* Payment bars for each mortgage type */}
              {chartMortgageTypes.map((type) => (
                <Bar
                  key={type}
                  dataKey={`${type}Payment`}
                  name={`${MORTGAGE_CONFIGS[type].shortName}`}
                  fill={MORTGAGE_CONFIGS[type].color}
                  opacity={0.85}
                  barSize={10}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
          {chartMortgageTypes.map((type) => {
            const data = projections[type][selectedYear]
            const annualPayment = data.monthlyPayment * 12
            const paymentRatio =
              data.income > 0 ? ((annualPayment / data.income) * 100).toFixed(1) : "0"
            const netIncome = data.income - annualPayment

            return (
              <div key={type} className="text-center p-3 rounded-lg bg-muted/30">
                <div className="flex justify-center mb-2">
                  {renderShapeIndicator(type, MORTGAGE_CONFIGS[type].color, 16)}
                </div>
                <p className="text-xs font-medium text-foreground">
                  {MORTGAGE_CONFIGS[type].shortName}
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {paymentRatio}%
                </p>
                <p className="text-xs text-muted-foreground">of income</p>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Net income</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(netIncome)}/yr
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Income breakdown note */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Year {selectedYear}:</span>{" "}
            Household income is {formatCurrency(projections.retirement[selectedYear]?.income || 0)}/year.
            {applicants.length > 1 && " This combines income from both applicants, accounting for individual retirement ages."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
