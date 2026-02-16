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
const FAMILY_SECTION_GAP = 16
const FAMILY_LABEL_WIDTH = 90

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
  const darkMode = useUIStore((s) => s.darkMode)

  const containerWidth = containerRef.current?.clientWidth ?? 1200

  const layoutResult = useMemo(
    () => getPhaseLayout(phases, originDate, viewport.pixelsPerDay),
    [phases, originDate, viewport.pixelsPerDay],
  )

  const visibleRegular = useMemo(
    () => getVisiblePhases(layoutResult.regularLayouts, viewport, containerWidth),
    [layoutResult.regularLayouts, viewport, containerWidth],
  )

  const visibleFamily = useMemo(
    () => getVisiblePhases(layoutResult.familyLayouts, viewport, containerWidth),
    [layoutResult.familyLayouts, viewport, containerWidth],
  )

  const ticks = useMemo(
    () => getAxisTicks(originDate, viewport, containerWidth),
    [originDate, viewport, containerWidth],
  )

  const categoryRowCount = layoutResult.categoryRowCount || 1
  const familyLaneCount = layoutResult.familyLanes.length

  const regularSectionHeight = categoryRowCount * (ROW_HEIGHT + ROW_GAP)
  const familySectionTop = HEADER_HEIGHT + regularSectionHeight + (familyLaneCount > 0 ? FAMILY_SECTION_GAP : 0)
  const familySectionHeight = familyLaneCount * (ROW_HEIGHT + ROW_GAP)
  const heatbandTop = familySectionTop + familySectionHeight + 8
  const totalHeight = heatbandTop + HEATBAND_HEIGHT + 20

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

  const hatchFill = darkMode ? 'url(#auto-hatch-dark)' : 'url(#auto-hatch)'

  return (
    <div ref={containerRef} className={className} style={{ overflow: 'hidden', width: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height={totalHeight}
        style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
      >
        {/* Patterns */}
        <defs>
          <pattern id="auto-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="white" strokeWidth="1.5" opacity="0.35" />
          </pattern>
          <pattern id="auto-hatch-dark" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="black" strokeWidth="1.5" opacity="0.25" />
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

        {/* Regular phase bars */}
        <g transform={`translate(${viewport.offsetX}, ${HEADER_HEIGHT})`}>
          {visibleRegular.map((layout) => {
            const { phase, x, width, row, bandHeight } = layout
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
                  height={bandHeight}
                  rx={4}
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected ? 'hsl(var(--foreground))' : color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={dash}
                />
                {width > 50 && (
                  <text
                    x={x + 8}
                    y={y + bandHeight / 2 + 4}
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

        {/* Family member section divider */}
        {familyLaneCount > 0 && (
          <g>
            <line
              x1={0}
              y1={familySectionTop - FAMILY_SECTION_GAP / 2}
              x2={containerWidth}
              y2={familySectionTop - FAMILY_SECTION_GAP / 2}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              opacity={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={8}
              y={familySectionTop - 4}
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
              fontWeight={600}
              textTransform="uppercase"
            >
              FAMILY
            </text>
          </g>
        )}

        {/* Family member lane labels */}
        {layoutResult.familyLanes.map((lane) => {
          const y = familySectionTop + lane.row * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 + 4
          return (
            <text
              key={lane.familyMemberId}
              x={8}
              y={y}
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
              fontWeight={500}
            >
              {lane.label.length > 12 ? lane.label.slice(0, 11) + '\u2026' : lane.label}
            </text>
          )
        })}

        {/* Family phase bars */}
        <g transform={`translate(${viewport.offsetX}, ${familySectionTop})`}>
          {visibleFamily.map((layout) => {
            const { phase, x, width, row, bandHeight, yOffset } = layout
            const y = row * (ROW_HEIGHT + ROW_GAP) + yOffset
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
                  height={bandHeight}
                  rx={Math.min(4, bandHeight / 2)}
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected ? 'hsl(var(--foreground))' : color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={dash}
                />
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={bandHeight}
                  rx={Math.min(4, bandHeight / 2)}
                  fill={hatchFill}
                  pointerEvents="none"
                />
                {width > 60 && bandHeight >= 20 && (
                  <text
                    x={x + 8}
                    y={y + bandHeight / 2 + 4}
                    fontSize={bandHeight >= 30 ? 11 : 9}
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
          <g transform={`translate(0, ${heatbandTop})`}>
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
