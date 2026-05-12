"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type MortgageType,
  MORTGAGE_CONFIGS,
  CHART_COLORS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"

interface ProjectionChartProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
  onYearChange: (year: number) => void
}

type ChartView = "equity" | "balance" | "property"

export function ProjectionChart({
  projections,
  selectedYear,
  onYearChange,
}: ProjectionChartProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

  // Combine data for multi-line chart
  const combinedData = projections.retirement.map((_, index) => {
    const dataPoint: Record<string, number> = {
      year: projections.retirement[index].year,
      age: projections.retirement[index].age,
      propertyValue: projections.retirement[index].propertyValue,
    }

    mortgageTypes.forEach((type) => {
      dataPoint[`${type}Equity`] = projections[type][index].equity
      dataPoint[`${type}Balance`] = projections[type][index].loanBalance
    })

    return dataPoint
  })

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">Year {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const handleChartClick = (data: { activePayload?: Array<{ payload: { year: number } }> }) => {
    if (data && data.activePayload && data.activePayload[0]) {
      onYearChange(data.activePayload[0].payload.year)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>40-Year Projection Comparison</CardTitle>
        <CardDescription>
          Compare equity, loan balance, and property value across all mortgage types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="balance">Loan Balance</TabsTrigger>
            <TabsTrigger value="property">Property Value</TabsTrigger>
          </TabsList>

          <TabsContent value="equity" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} onClick={handleChartClick}>
                  <defs>
                    {mortgageTypes.map((type) => (
                      <linearGradient
                        key={type}
                        id={`gradient-${type}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={MORTGAGE_CONFIGS[type].color}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={MORTGAGE_CONFIGS[type].color}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `Y${value}`}
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
                  <ReferenceLine
                    x={selectedYear}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Year ${selectedYear}`,
                      position: "top",
                      fill: "#1e40af",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  />
                  {mortgageTypes.map((type) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={`${type}Equity`}
                      name={MORTGAGE_CONFIGS[type].shortName}
                      stroke={MORTGAGE_CONFIGS[type].color}
                      fill={`url(#gradient-${type})`}
                      strokeWidth={3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `Y${value}`}
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
                  <ReferenceLine
                    x={selectedYear}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Year ${selectedYear}`,
                      position: "top",
                      fill: "#1e40af",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  />
                  {mortgageTypes.map((type) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={`${type}Balance`}
                      name={MORTGAGE_CONFIGS[type].shortName}
                      stroke={MORTGAGE_CONFIGS[type].color}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} onClick={handleChartClick}>
                  <defs>
                    <linearGradient id="propertyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.property} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.property} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => `Y${value}`}
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
                  <ReferenceLine
                    x={selectedYear}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Year ${selectedYear}`,
                      position: "top",
                      fill: "#1e40af",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="propertyValue"
                    name="Property Value"
                    stroke={CHART_COLORS.property}
                    fill="url(#propertyGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
