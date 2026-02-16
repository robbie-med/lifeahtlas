import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLiveDebtPlans } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'
import { computeDebtPayoff } from '@/engine/debt-engine'
import { DebtStrategy } from '@/types'

interface DebtPayoffViewProps {
  scenarioId: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem}mo`
  if (rem === 0) return `${years}yr`
  return `${years}yr ${rem}mo`
}

const STRATEGY_LABELS: Record<DebtStrategy, string> = {
  'minimum-payment': 'Minimum Payment',
  'snowball': 'Snowball (smallest first)',
  'avalanche': 'Avalanche (highest rate first)',
  'fixed-payment': 'Fixed Payment',
}

export function DebtPayoffView({ scenarioId }: DebtPayoffViewProps) {
  const debtPlans = useLiveDebtPlans(scenarioId)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    principalBalance: 0,
    annualInterestRate: 6.8,
    minimumPayment: 200,
    monthlyPayment: 500,
    strategy: DebtStrategy.Avalanche as DebtStrategy,
    startDate: '',
    extraPayment: 300,
  })

  const payoffResult = useMemo(() => {
    if (!debtPlans || debtPlans.length === 0) return null
    return computeDebtPayoff({ debtPlans })
  }, [debtPlans])

  // Build chart data: monthly balance per debt over time
  const chartData = useMemo(() => {
    if (!payoffResult) return []
    const monthMap = new Map<string, Record<string, string | number>>()
    for (const entry of payoffResult.schedule) {
      let row = monthMap.get(entry.month)
      if (!row) {
        row = { month: entry.month }
        monthMap.set(entry.month, row)
      }
      row[entry.debtName] = entry.endingBalance
    }
    // Downsample if too many months
    const data = Array.from(monthMap.values())
    if (data.length <= 200) return data
    const step = Math.ceil(data.length / 200)
    return data.filter((_, i) => i % step === 0 || i === data.length - 1)
  }, [payoffResult])

  const debtNames = useMemo(() => debtPlans?.map((d) => d.name) ?? [], [debtPlans])

  const DEBT_COLORS = ['hsl(0, 70%, 55%)', 'hsl(25, 85%, 55%)', 'hsl(270, 55%, 55%)', 'hsl(195, 75%, 45%)', 'hsl(340, 75%, 55%)']

  const handleAdd = async () => {
    if (!form.name || !form.startDate) return
    await financialActions.createDebtPlan({ ...form, scenarioId })
    setForm({
      name: '',
      principalBalance: 0,
      annualInterestRate: 6.8,
      minimumPayment: 200,
      monthlyPayment: 500,
      strategy: DebtStrategy.Avalanche,
      startDate: '',
      extraPayment: 300,
    })
    setAdding(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Debt Payoff Plans</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add Debt'}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Debt name (e.g., Student Loans, Car Note)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Principal Balance $</Label>
                <Input
                  type="number"
                  value={form.principalBalance}
                  onChange={(e) => setForm((f) => ({ ...f, principalBalance: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Interest Rate %/yr</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.annualInterestRate}
                  onChange={(e) => setForm((f) => ({ ...f, annualInterestRate: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Minimum Payment $/mo</Label>
                <Input
                  type="number"
                  value={form.minimumPayment}
                  onChange={(e) => setForm((f) => ({ ...f, minimumPayment: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Extra Payment $/mo</Label>
                <Input
                  type="number"
                  value={form.extraPayment}
                  onChange={(e) => setForm((f) => ({ ...f, extraPayment: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Strategy</Label>
                <Select
                  value={form.strategy}
                  onChange={(e) => setForm((f) => ({ ...f, strategy: e.target.value as DebtStrategy }))}
                >
                  {Object.entries(DebtStrategy).map(([, v]) => (
                    <option key={v} value={v}>{STRATEGY_LABELS[v]}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Payoff Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full">
              Add Debt Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing debt plan cards */}
      {debtPlans?.map((d) => (
        <Card key={d.id}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(d.principalBalance)} at {d.annualInterestRate}% &middot;{' '}
                {formatCurrency(d.minimumPayment)}/mo min + {formatCurrency(d.extraPayment)}/mo extra
              </p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {STRATEGY_LABELS[d.strategy]}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => financialActions.removeDebtPlan(d.id)}>
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Payoff results */}
      {payoffResult && payoffResult.summaries.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {payoffResult.summaries.map((s) => (
              <Card key={s.debtId}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm">{s.debtName}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1 text-xs space-y-1">
                  <p>Original: <span className="font-medium">{formatCurrency(s.originalBalance)}</span></p>
                  <p>Total Interest: <span className="font-medium text-red-600">{formatCurrency(s.totalInterestPaid)}</span></p>
                  <p>Total Paid: <span className="font-medium">{formatCurrency(s.totalPaid)}</span></p>
                  <p>
                    Payoff: <span className="font-medium">{formatMonths(s.monthsToPayoff)}</span>
                    {s.payoffDate && <span className="text-muted-foreground"> ({s.payoffDate})</span>}
                  </p>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-muted/50">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Totals</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-1 text-xs space-y-1">
                <p>Total Interest: <span className="font-medium text-red-600">{formatCurrency(payoffResult.totalInterestPaid)}</span></p>
                <p>Total Paid: <span className="font-medium">{formatCurrency(payoffResult.totalPaid)}</span></p>
                <p>Debt-free by: <span className="font-medium">{payoffResult.lastPayoffDate || 'N/A'}</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Balance-over-time chart */}
          {chartData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Balance Over Time</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  {debtNames.map((name, i) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={DEBT_COLORS[i % DEBT_COLORS.length]}
                      fill={DEBT_COLORS[i % DEBT_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
