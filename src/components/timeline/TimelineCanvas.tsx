import { useRef, useMemo, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import { parseISO } from 'date-fns'
import { useUIStore } from '@/stores/uiStore'
import {
  getAxisTicks,
  getPhaseLayout,
  getVisiblePhases,
  clampPixelsPerDay,
} from '@/engine/timeline-engine'
import { CATEGORY_COLORS, CERTAINTY_OPACITY, CERTAINTY_DASH } from '@/utils/colors'
import type { Phase } from '@/types'

const ROW_HEIGHT = 44
const ROW_GAP = 6
const HEADER_HEIGHT = 40
const HEATBAND_HEIGHT = 24

interface TimelineCanvasProps {
  phases: Phase[]
  originDate: Date
  stressScores?: { month: string; composite: number }[]
  onPhaseClick?: (phaseId: string) => void
  className?: string
}

export function TimelineCanvas({
  phases,
  originDate,
  stressScores,
  onPhaseClick,
  className,
}: TimelineCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const viewport = useUIStore((s) => s.viewport)
  const setViewport = useUIStore((s) => s.setViewport)
  const setPixelsPerDay = useUIStore((s) => s.setPixelsPerDay)
  const selectedPhaseId = useUIStore((s) => s.selectedPhaseId)
  const selectPhase = useUIStore((s) => s.selectPhase)

  const containerWidth = containerRef.current?.clientWidth ?? 1200

  const layouts = useMemo(
    () => getPhaseLayout(phases, originDate, viewport.pixelsPerDay),
    [phases, originDate, viewport.pixelsPerDay],
  )

  const visibleLayouts = useMemo(
    () => getVisiblePhases(layouts, viewport, containerWidth),
    [layouts, viewport, containerWidth],
  )

  const ticks = useMemo(
    () => getAxisTicks(originDate, viewport, containerWidth),
    [originDate, viewport, containerWidth],
  )

  const categoryCount = useMemo(() => {
    const cats = new Set(phases.map((p) => p.category))
    return cats.size || 1
  }, [phases])

  const totalHeight = HEADER_HEIGHT + categoryCount * (ROW_HEIGHT + ROW_GAP) + HEATBAND_HEIGHT + 20

  const handlePhaseClick = useCallback(
    (phaseId: string) => {
      selectPhase(phaseId)
      onPhaseClick?.(phaseId)
    },
    [selectPhase, onPhaseClick],
  )

  useGesture(
    {
      onDrag: ({ delta: [dx] }) => {
        setViewport({ offsetX: viewport.offsetX + dx })
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey) {
          // Zoom
          const factor = dy > 0 ? 0.9 : 1.1
          const newPpd = clampPixelsPerDay(viewport.pixelsPerDay * factor)
          setPixelsPerDay(newPpd)
        } else {
          // Pan
          setViewport({ offsetX: viewport.offsetX - dy })
        }
      },
    },
    {
      target: svgRef,
      drag: { filterTaps: true },
      wheel: { eventOptions: { passive: false } },
    },
  )

  return (
    <div ref={containerRef} className={className} style={{ overflow: 'hidden', width: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height={totalHeight}
        style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
      >
        {/* Pattern for auto-generated phases */}
        <defs>
          <pattern id="auto-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="white" strokeWidth="1.5" opacity="0.3" />
          </pattern>
        </defs>

        {/* Axis ticks */}
        <g>
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={HEADER_HEIGHT - 8}
                x2={tick.x}
                y2={totalHeight}
                stroke="hsl(var(--border))"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.5 : 0.2}
              />
              <text
                x={tick.x + 4}
                y={HEADER_HEIGHT - 14}
                fontSize={tick.isMajor ? 12 : 10}
                fill="hsl(var(--muted-foreground))"
                fontWeight={tick.isMajor ? 600 : 400}
              >
                {tick.label}
              </text>
            </g>
          ))}
        </g>

        {/* Phase bars */}
        <g transform={`translate(${viewport.offsetX}, ${HEADER_HEIGHT})`}>
          {visibleLayouts.map((layout) => {
            const { phase, x, width, row } = layout
            const y = row * (ROW_HEIGHT + ROW_GAP)
            const color = CATEGORY_COLORS[phase.category]
            const opacity = CERTAINTY_OPACITY[phase.certainty]
            const dash = CERTAINTY_DASH[phase.certainty]
            const isSelected = phase.id === selectedPhaseId

            return (
              <g
                key={phase.id}
                onClick={() => handlePhaseClick(phase.id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={ROW_HEIGHT}
                  rx={4}
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected ? 'hsl(var(--foreground))' : color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={dash}
                />
                {phase.autoGenerated && (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={ROW_HEIGHT}
                    rx={4}
                    fill="url(#auto-hatch)"
                    pointerEvents="none"
                  />
                )}
                {width > 50 && (
                  <text
                    x={x + 8}
                    y={y + ROW_HEIGHT / 2 + 4}
                    fontSize={11}
                    fill="white"
                    fontWeight={500}
                    clipPath={`inset(0 ${Math.max(0, width - 16)}px 0 0)`}
                  >
                    {phase.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Stress heatband */}
        {stressScores && stressScores.length > 0 && (
          <g transform={`translate(0, ${HEADER_HEIGHT + categoryCount * (ROW_HEIGHT + ROW_GAP) + 8})`}>
            {stressScores.map((score, i) => {
              const date = parseISO(score.month + '-01')
              const x =
                (date.getTime() - originDate.getTime()) / 86400000 * viewport.pixelsPerDay +
                viewport.offsetX
              const barWidth = 30 * viewport.pixelsPerDay // ~1 month
              const hue = score.composite <= 25 ? 120 : score.composite <= 50 ? 50 : score.composite <= 75 ? 30 : 0
              const sat = 60 + score.composite * 0.3
              return (
                <rect
                  key={i}
                  x={x}
                  y={0}
                  width={Math.max(barWidth, 1)}
                  height={HEATBAND_HEIGHT}
                  fill={`hsl(${hue}, ${sat}%, 50%)`}
                  opacity={0.7}
                >
                  <title>{`${score.month}: stress ${score.composite}/100`}</title>
                </rect>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
