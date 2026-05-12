"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { type ProjectionData } from "@/lib/mortgage-calculations"
import { Calendar, Clock } from "lucide-react"

interface YearSelectorProps {
  selectedYear: number
  onYearChange: (year: number) => void
  maxYears: number
  currentAge: number
}

export function YearSelector({
  selectedYear,
  onYearChange,
  maxYears,
  currentAge,
}: YearSelectorProps) {
  return (
    <Card className="bg-primary text-primary-foreground">
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Projection Timeline</h3>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Drag the slider or click on the chart to view projections at different points in time
            </p>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Year {selectedYear}</span>
              </div>
              <span className="text-sm text-primary-foreground/80">
                Age {currentAge + selectedYear}
              </span>
            </div>

            <Slider
              value={[selectedYear]}
              onValueChange={(value) => onYearChange(value[0])}
              max={maxYears}
              min={0}
              step={1}
              className="[&_[data-slot=slider-track]]:bg-primary-foreground/20 [&_[data-slot=slider-range]]:bg-primary-foreground [&_[data-slot=slider-thumb]]:border-primary-foreground"
            />

            <div className="flex justify-between text-xs text-primary-foreground/60">
              <span>Now</span>
              <span>10 years</span>
              <span>20 years</span>
              <span>30 years</span>
              <span>40 years</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
