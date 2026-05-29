"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  type MortgageType,
  type MortgageConfig,
  MORTGAGE_CONFIGS,
  type ProjectionData,
  formatCurrency,
} from "@/lib/mortgage-calculations"
import { TrendingUp, TrendingDown, Home, Wallet, Pencil } from "lucide-react"

interface SummaryCardsProps {
  projections: Record<MortgageType, ProjectionData[]>
  selectedYear: number
  lifetimeOptionalPayment?: number
  onLifetimePaymentChange?: (payment: number) => void
  mortgageConfigs?: Record<MortgageType, MortgageConfig>
}

export function SummaryCards({ 
  projections, 
  selectedYear, 
  lifetimeOptionalPayment = 0,
  onLifetimePaymentChange,
  mortgageConfigs = MORTGAGE_CONFIGS
}: SummaryCardsProps) {
  const mortgageTypes: MortgageType[] = ["retirement", "rio", "lifetime", "homeReversion"]
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentInput, setPaymentInput] = useState(lifetimeOptionalPayment.toString())

  const handleOpenModal = () => {
    setPaymentInput(lifetimeOptionalPayment.toString())
    setIsModalOpen(true)
  }

  const handleUpdatePayment = () => {
    const value = parseFloat(paymentInput) || 0
    onLifetimePaymentChange?.(Math.max(0, value))
    setIsModalOpen(false)
  }

  // Early return if projections aren't loaded yet
  if (!projections?.retirement?.length) {
    return null
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {mortgageTypes.map((type) => {
        const config = mortgageConfigs[type]
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
            <CardContent className="py-2">
              <div className="flex items-start justify-between mb-2">
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

              <div className="space-y-1">
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
                    {type === "lifetime" && onLifetimePaymentChange && (
                      <button
                        onClick={handleOpenModal}
                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit optional monthly payment"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>

    {/* Lifetime Payment Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Optional monthly payment</DialogTitle>
          <DialogDescription>
            Lifetime mortgages allow optional monthly payments to reduce interest roll-up. 
            Enter an amount you&apos;d like to pay each month (or leave as 0 for no payments).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="payment">Monthly payment amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <Input
                id="payment"
                type="number"
                min="0"
                step="50"
                value={paymentInput}
                onChange={(e) => setPaymentInput(e.target.value)}
                className="pl-7"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paying the monthly interest ({formatCurrency(projections.lifetime[0]?.loanBalance * 0.065 / 12)}) 
              would keep your loan balance stable.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdatePayment}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
