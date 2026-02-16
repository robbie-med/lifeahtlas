import { stressColor } from '@/utils/colors'

interface StressGaugeProps {
  score: number // 0-100
  label?: string
  size?: number
}

export function StressGauge({ score, label = 'Stress', size = 120 }: StressGaugeProps) {
  const radius = size / 2 - 10
  const circumference = Math.PI * radius // half circle
  const progress = (score / 100) * circumference
  const color = stressColor(score)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M ${10} ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 5}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${10} ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 5}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          fontSize={size / 4}
          fontWeight={700}
          fill="hsl(var(--foreground))"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  )
}
