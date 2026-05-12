"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  applicants?: ApplicantData[]
}

type ChartView = "equity" | "balance" | "property"

// Custom dot component for accessibility - renders different shapes for each mortgage type
const CustomDot = ({ cx, cy, payload, dataKey, mortgageType }: { 
  cx?: number; 
  cy?: number; 
  payload?: { year: number }; 
  dataKey?: string;
  mortgageType: MortgageType;
}) => {
  if (cx === undefined || cy === undefined || !payload) return null
  
  // Only show dots at intervals for cleaner visualization
  const pattern = ACCESSIBILITY_PATTERNS[mortgageType]
  if (payload.year % pattern.markerInterval !== 0) return null
  
  const color = MORTGAGE_CONFIGS[mortgageType].color
  const size = 4
  
  switch (pattern.markerShape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={size} fill={color} stroke="#fff" strokeWidth={1.5} />
    case 'square':
      return <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill={color} stroke="#fff" strokeWidth={1.5} />
    case 'triangle':
      const trianglePoints = `${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`
      return <polygon points={trianglePoints} fill={color} stroke="#fff" strokeWidth={1.5} />
    case 'diamond':
      const diamondPoints = `${cx},${cy - size * 1.2} ${cx + size},${cy} ${cx},${cy + size * 1.2} ${cx - size},${cy}`
      return <polygon points={diamondPoints} fill={color} stroke="#fff" strokeWidth={1.5} />
    default:
      return <circle cx={cx} cy={cy} r={size} fill={color} stroke="#fff" strokeWidth={1.5} />
  }
}

export function ProjectionChart({
  projections,
  selectedYear,
  onYearChange,
  applicants = [],
}: ProjectionChartProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]

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
    // Both retire at same time
    retirementLabels.push({ title: "Both retired", years: retirementMarkers[0].year })
  } else if (retirementMarkers.length >= 1) {
    // First retirement
    retirementLabels.push({ title: "First retirement", years: retirementMarkers[0].year })
    if (retirementMarkers.length === 2) {
      // Both retired (second person)
      retirementLabels.push({ title: "Both retired", years: retirementMarkers[1].year })
    }
  }

  // Unique years for reference lines (no labels on chart)
  const uniqueRetirementYears = [...new Set(retirementMarkers.map(m => m.year))]

  // Get scaled x-axis ticks
  const scaledTicks = getScaledXAxisTicks()

  // Calculate current ages for each applicant
  const applicantCurrentAges = applicants.map(a => calculateAge(a.dateOfBirth))

  // Combine data for multi-line chart with scaled x position
  const combinedData = projections.retirement.map((_, index) => {
    const year = projections.retirement[index].year
    const dataPoint: Record<string, number | number[]> = {
      year: year,
      scaledX: yearToScaledPosition(year),
      age: projections.retirement[index].age,
      propertyValue: projections.retirement[index].propertyValue,
      applicantAges: applicantCurrentAges.map(currentAge => currentAge + year),
    }

    mortgageTypes.forEach((type) => {
      dataPoint[`${type}Equity`] = projections[type][index].equity as number
      dataPoint[`${type}Balance`] = projections[type][index].loanBalance as number
    })

    return dataPoint
  })

  // Helper to render shape indicator in tooltip
  const renderShapeIndicator = (type: MortgageType, color: string) => {
    const pattern = ACCESSIBILITY_PATTERNS[type]
    const size = 10
    
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
        return <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    }
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string; payload: { year: number; applicantAges?: number[] } }> }) => {
    if (active && payload && payload.length) {
      const year = payload[0]?.payload?.year
      const applicantAges = payload[0]?.payload?.applicantAges || []
      
      // Format ages display
      const agesDisplay = applicantAges.length > 0 
        ? applicantAges.length === 1 
          ? `Age ${applicantAges[0]}`
          : `Ages ${applicantAges[0]} & ${applicantAges[1]}`
        : ''
      
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">Year {year} {agesDisplay && `(${agesDisplay})`}</p>
          {payload.map((entry, index) => {
            // Find the mortgage type from the dataKey
            const typeMatch = entry.dataKey?.match(/^(retirement|rio|lifetime|homeReversion)/)
            const mortgageType = typeMatch ? typeMatch[1] as MortgageType : null
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                {mortgageType ? renderShapeIndicator(mortgageType, entry.color) : (
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                )}
                <span className="text-muted-foreground">{entry.name}:</span>
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

  const handleChartClick = (data: { activePayload?: Array<{ payload: { year: number } }> }) => {
    if (data && data.activePayload && data.activePayload[0]) {
      onYearChange(data.activePayload[0].payload.year)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>40-year projection comparison</CardTitle>
        <CardDescription>
          Compare equity, loan balance, and property value across all mortgage types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="balance">Loan balance</TabsTrigger>
            <TabsTrigger value="property">Property value</TabsTrigger>
          </TabsList>

          <TabsContent value="equity" className="space-y-4">
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
                      <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{label.title}</p>
                      <p className="text-xs" style={{ color: '#dc2626', opacity: 0.8 }}>In {label.years} {label.years === 1 ? 'year' : 'years'}</p>
                    </div>
                  ))}
                </div>
              )}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} onClick={handleChartClick} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                    formatter={(value, entry) => {
                      const typeMatch = entry.dataKey?.match(/^(retirement|rio|lifetime|homeReversion)/)
                      const mortgageType = typeMatch ? typeMatch[1] as MortgageType : null
                      return (
                        <span className="inline-flex items-center gap-1.5" style={{ color: "#374151" }}>
                          {mortgageType && renderShapeIndicator(mortgageType, entry.color || '#000')}
                          {value}
                        </span>
                      )
                    }}
                  />
                  {/* Retirement reference lines */}
                  {uniqueRetirementYears.map((year, index) => (
                    <ReferenceLine
                      key={`retirement-${index}`}
                      x={yearToScaledPosition(year)}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  ))}
                  <ReferenceLine
                    x={yearToScaledPosition(selectedYear)}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
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
                      strokeDasharray={ACCESSIBILITY_PATTERNS[type].strokeDasharray}
                      dot={(props) => <CustomDot {...props} mortgageType={type} />}
                      activeDot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
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
                      <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{label.title}</p>
                      <p className="text-xs" style={{ color: '#dc2626', opacity: 0.8 }}>In {label.years} {label.years === 1 ? 'year' : 'years'}</p>
                    </div>
                  ))}
                </div>
              )}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} onClick={handleChartClick} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                    formatter={(value, entry) => {
                      const typeMatch = entry.dataKey?.match(/^(retirement|rio|lifetime|homeReversion)/)
                      const mortgageType = typeMatch ? typeMatch[1] as MortgageType : null
                      return (
                        <span className="inline-flex items-center gap-1.5" style={{ color: "#374151" }}>
                          {mortgageType && renderShapeIndicator(mortgageType, entry.color || '#000')}
                          {value}
                        </span>
                      )
                    }}
                  />
                  {/* Retirement reference lines */}
                  {uniqueRetirementYears.map((year, index) => (
                    <ReferenceLine
                      key={`retirement-${index}`}
                      x={yearToScaledPosition(year)}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  ))}
                  <ReferenceLine
                    x={yearToScaledPosition(selectedYear)}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  {mortgageTypes.map((type) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={`${type}Balance`}
                      name={MORTGAGE_CONFIGS[type].shortName}
                      stroke={MORTGAGE_CONFIGS[type].color}
                      strokeWidth={3}
                      strokeDasharray={ACCESSIBILITY_PATTERNS[type].strokeDasharray}
                      dot={(props) => <CustomDot {...props} mortgageType={type} />}
                      activeDot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-4">
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
                      <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{label.title}</p>
                      <p className="text-xs" style={{ color: '#dc2626', opacity: 0.8 }}>In {label.years} {label.years === 1 ? 'year' : 'years'}</p>
                    </div>
                  ))}
                </div>
              )}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} onClick={handleChartClick} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="propertyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.property} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.property} stopOpacity={0.05} />
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
                    formatter={(value, entry) => {
                      const typeMatch = entry.dataKey?.match(/^(retirement|rio|lifetime|homeReversion)/)
                      const mortgageType = typeMatch ? typeMatch[1] as MortgageType : null
                      return (
                        <span className="inline-flex items-center gap-1.5" style={{ color: "#374151" }}>
                          {mortgageType && renderShapeIndicator(mortgageType, entry.color || '#000')}
                          {value}
                        </span>
                      )
                    }}
                  />
                  {/* Retirement reference lines */}
                  {uniqueRetirementYears.map((year, index) => (
                    <ReferenceLine
                      key={`retirement-${index}`}
                      x={yearToScaledPosition(year)}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  ))}
                  <ReferenceLine
                    x={yearToScaledPosition(selectedYear)}
                    stroke="#1e40af"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="propertyValue"
                    name="Property value"
                    stroke={CHART_COLORS.property}
                    fill="url(#propertyGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
