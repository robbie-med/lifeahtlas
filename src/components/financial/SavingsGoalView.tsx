import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLiveSavingsGoals } from '@/hooks/useLiveData'
import { financialActions } from '@/stores/financialStore'
import { computeSavingsProjection, getRetirementReadiness } from '@/engine/savings-engine'
import type { SavingsGoal } from '@/types'

interface SavingsGoalViewProps {
  scenarioId: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

const GOAL_TYPE_LABELS: Record<SavingsGoal['type'], string> = {
  emergency: 'Emergency Fund',
  retirement: 'Retirement',
  education: 'Education (529)',
  house: 'House Down Payment',
  custom: 'Custom Goal',
}

const GOAL_COLORS = ['hsl(160, 60%, 45%)', 'hsl(221, 83%, 53%)', 'hsl(40, 95%, 50%)', 'hsl(270, 55%, 55%)', 'hsl(195, 75%, 45%)']

export function SavingsGoalView({ scenarioId }: SavingsGoalViewProps) {
  const goals = useLiveSavingsGoals(scenarioId)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    targetAmount: 0,
    currentBalance: 0,
    monthlyContribution: 500,
    annualReturnRate: 7,
    startDate: '',
    targetDate: '',
    type: 'retirement' as SavingsGoal['type'],
  })

  const projection = useMemo(() => {
    if (!goals || goals.length === 0) return []
    return computeSavingsProjection(goals)
  }, [goals])

  const retirement = useMemo(() => {
    if (!goals) return null
    return getRetirementReadiness(goals, projection)
  }, [goals, projection])

  // Chart: balance over time per goal
  const chartData = useMemo(() => {
    if (projection.length === 0) return []
    const monthMap = new Map<string, Record<string, string | number>>()
    for (const entry of projection) {
      let row = monthMap.get(entry.month)
      if (!row) {
        row = { month: entry.month }
        monthMap.set(entry.month, row)
      }
      row[entry.goalName] = entry.balance
    }
    const data = Array.from(monthMap.values())
    if (data.length <= 200) return data
    const step = Math.ceil(data.length / 200)
    return data.filter((_, i) => i % step === 0 || i === data.length - 1)
  }, [projection])

  const goalNames = useMemo(() => goals?.map((g) => g.name) ?? [], [goals])

  const handleAdd = async () => {
    if (!form.name || !form.startDate || !form.targetDate) return
    await financialActions.createSavingsGoal({ ...form, scenarioId })
    setForm({
      name: '',
      targetAmount: 0,
      currentBalance: 0,
      monthlyContribution: 500,
      annualReturnRate: 7,
      startDate: '',
      targetDate: '',
      type: 'retirement',
    })
    setAdding(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Savings & Retirement Goals</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add Goal'}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Goal name (e.g., 401(k), Emergency Fund)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SavingsGoal['type'] }))}
                >
                  {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target Amount $</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Current Balance $</Label>
                <Input
                  type="number"
                  value={form.currentBalance}
                  onChange={(e) => setForm((f) => ({ ...f, currentBalance: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Monthly Contribution $</Label>
                <Input
                  type="number"
                  value={form.monthlyContribution}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Annual Return %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.annualReturnRate}
                  onChange={(e) => setForm((f) => ({ ...f, annualReturnRate: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Target Date</Label>
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full">
              Add Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing goals */}
      {goals?.map((g) => {
        const goalProjection = projection.filter((p) => p.goalId === g.id)
        const lastMonth = goalProjection.length > 0 ? goalProjection[goalProjection.length - 1] : null
        return (
          <Card key={g.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{g.name}</p>
                  <Badge variant="secondary" className="text-[10px]">{GOAL_TYPE_LABELS[g.type]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(g.currentBalance)} now &rarr; {formatCurrency(g.targetAmount)} target
                  &middot; {formatCurrency(g.monthlyContribution)}/mo &middot; {g.annualReturnRate}% return
                </p>
                {lastMonth && (
                  <p className="text-xs mt-0.5">
                    Projected: <span className="font-medium">{formatCurrency(lastMonth.balance)}</span>
                    {' '}({lastMonth.percentComplete}% of goal)
                  </p>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => financialActions.removeSavingsGoal(g.id)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {/* Retirement readiness summary */}
      {retirement && retirement.retirementGoals.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm">Retirement Readiness</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 text-xs space-y-1">
            <p>Projected retirement savings: <span className="font-medium">{formatCurrency(retirement.totalRetirementSaved)}</span></p>
            <p>Estimated monthly income (4% rule): <span className="font-medium">{formatCurrency(retirement.monthlyRetirementIncome)}/mo</span></p>
            {retirement.retirementGoals.map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, g.percent)}%` }}
                  />
                </div>
                <span className="w-16 text-right">{g.percent}%</span>
                <span className="text-muted-foreground">{g.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Growth chart */}
      {chartData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Savings Growth</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              {goalNames.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={GOAL_COLORS[i % GOAL_COLORS.length]}
                  fill={GOAL_COLORS[i % GOAL_COLORS.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
