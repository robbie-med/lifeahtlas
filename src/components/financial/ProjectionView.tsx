import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MonthlyProjection } from '@/types'

interface ProjectionViewProps {
  projections: MonthlyProjection[]
  className?: string
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function downsample(data: MonthlyProjection[], maxPoints = 200): MonthlyProjection[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0)
}

export function ProjectionView({ projections, className }: ProjectionViewProps) {
  const data = downsample(projections)

  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-2">Net Worth Projection</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={70} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Month: ${label}`}
          />
          {/* Uncertainty band */}
          <Area
            type="monotone"
            dataKey="netWorthHigh"
            name="High"
            stroke="none"
            fill="hsl(221, 83%, 53%)"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="netWorthLow"
            name="Low"
            stroke="none"
            fill="hsl(221, 83%, 53%)"
            fillOpacity={0.1}
          />
          {/* Main line */}
          <Area
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke="hsl(221, 83%, 53%)"
            fill="hsl(221, 83%, 53%)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
