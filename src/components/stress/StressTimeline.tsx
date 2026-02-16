import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { StressScore } from '@/types'

interface StressTimelineProps {
  scores: StressScore[]
  className?: string
}

function downsample(data: StressScore[], maxPoints = 200): StressScore[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0)
}

export function StressTimeline({ scores, className }: StressTimelineProps) {
  const data = downsample(scores)

  return (
    <div className={className}>
      <h3 className="text-sm font-medium mb-2">Stress Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length) return null
              const s = payload[0].payload as StressScore
              return (
                <div className="bg-background border rounded p-2 text-xs shadow-lg">
                  <p className="font-medium">{label}</p>
                  <p>Composite: {s.composite}/100</p>
                  <p>Free Time: {s.freeTime}</p>
                  <p>Financial: {s.financialSurplus}</p>
                  <p>Overlap: {s.overlapCount}</p>
                  <p>Caregiving: {s.caregivingLoad}</p>
                  <p>Sleep: {s.sleepProxy}</p>
                  <p>Emotional: {s.emotionalLoad}</p>
                </div>
              )
            }}
          />
          <ReferenceLine y={70} stroke="hsl(0, 70%, 55%)" strokeDasharray="3 3" label="High" />
          <Area
            type="monotone"
            dataKey="composite"
            stroke="hsl(25, 85%, 55%)"
            fill="hsl(25, 85%, 55%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
