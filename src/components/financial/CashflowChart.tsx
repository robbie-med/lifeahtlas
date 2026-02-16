import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MonthlyProjection } from '@/types'

interface CashflowChartProps {
  projections: MonthlyProjection[]
  className?: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

// Sample every Nth point for performance
function downsample(data: MonthlyProjection[], maxPoints = 200): MonthlyProjection[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0)
}

export function CashflowChart({ projections, className }: CashflowChartProps) {
  const data = downsample(projections)

  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-2">Monthly Cashflow</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="totalIncome"
            name="Income"
            stroke="hsl(160, 60%, 45%)"
            fill="hsl(160, 60%, 45%)"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="totalExpenses"
            name="Expenses"
            stroke="hsl(0, 70%, 55%)"
            fill="hsl(0, 70%, 55%)"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
