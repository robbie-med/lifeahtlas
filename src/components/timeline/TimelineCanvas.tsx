import { useRef, useState, useMemo, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import { parseISO, differenceInDays } from 'date-fns'
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
const SCROLLBAR_HEIGHT = 14
const SCROLLBAR_TRACK_HEIGHT = 8
const MIN_THUMB_WIDTH = 40
const CONTENT_PADDING_DAYS = 365 // 1 year padding on each side

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
  const trackRef = useRef<HTMLDivElement>(null)

  const viewport = useUIStore((s) => s.viewport)
  const setViewport = useUIStore((s) => s.setViewport)
  const setPixelsPerDay = useUIStore((s) => s.setPixelsPerDay)
  const selectedPhaseId = useUIStore((s) => s.selectedPhaseId)
  const selectPhase = useUIStore((s) => s.selectPhase)
  const darkMode = useUIStore((s) => s.darkMode)

  const [draggingThumb, setDraggingThumb] = useState(false)
  const dragStartRef = useRef({ mouseX: 0, offsetX: 0 })

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

  // Compute total content extent in pixels (across all phases)
  const contentExtent = useMemo(() => {
    if (phases.length === 0) {
      // Default: show ~10 years from origin
      const defaultSpan = 3650 * viewport.pixelsPerDay
      return { minPx: -CONTENT_PADDING_DAYS * viewport.pixelsPerDay, maxPx: defaultSpan, totalPx: defaultSpan + 2 * CONTENT_PADDING_DAYS * viewport.pixelsPerDay }
    }

    let minDay = Infinity
    let maxDay = -Infinity
    for (const phase of phases) {
      const startDays = differenceInDays(parseISO(phase.startDate), originDate)
      const endDays = differenceInDays(parseISO(phase.endDate), originDate)
      if (startDays < minDay) minDay = startDays
      if (endDays > maxDay) maxDay = endDays
    }

    const minPx = (minDay - CONTENT_PADDING_DAYS) * viewport.pixelsPerDay
    const maxPx = (maxDay + CONTENT_PADDING_DAYS) * viewport.pixelsPerDay
    return { minPx, maxPx, totalPx: maxPx - minPx }
  }, [phases, originDate, viewport.pixelsPerDay])

  // Scrollbar geometry
  const scrollbar = useMemo(() => {
    const { minPx, totalPx } = contentExtent
    if (totalPx <= 0 || totalPx <= containerWidth) {
      return { visible: false, thumbWidth: 0, thumbLeft: 0 }
    }

    const ratio = containerWidth / totalPx
    const thumbWidth = Math.max(ratio * containerWidth, MIN_THUMB_WIDTH)
    const scrollableTrack = containerWidth - thumbWidth
    // offsetX = 0 means origin is at left edge. We need to map offsetX to thumb position.
    // viewLeft in content coords = -offsetX
    // progress = (viewLeft - minPx) / (totalPx - containerWidth)
    const viewLeft = -viewport.offsetX
    const maxScroll = totalPx - containerWidth
    const progress = Math.max(0, Math.min(1, (viewLeft - minPx) / maxScroll))
    const thumbLeft = progress * scrollableTrack

    return { visible: true, thumbWidth, thumbLeft }
  }, [contentExtent, containerWidth, viewport.offsetX])

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

  // Convert a track click/drag position to an offsetX
  const trackPositionToOffsetX = useCallback(
    (clientX: number) => {
      const trackEl = trackRef.current
      if (!trackEl) return viewport.offsetX
      const rect = trackEl.getBoundingClientRect()
      const { minPx, totalPx } = contentExtent
      const maxScroll = totalPx - containerWidth
      if (maxScroll <= 0) return 0

      const thumbWidth = Math.max((containerWidth / totalPx) * containerWidth, MIN_THUMB_WIDTH)
      const scrollableTrack = containerWidth - thumbWidth
      // Center the thumb on the click point
      const clickX = clientX - rect.left - thumbWidth / 2
      const progress = Math.max(0, Math.min(1, clickX / scrollableTrack))
      return -(minPx + progress * maxScroll)
    },
    [contentExtent, containerWidth, viewport.offsetX],
  )

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      // Only jump if clicking the track, not the thumb
      if ((e.target as HTMLElement).dataset.scrollThumb) return
      setViewport({ offsetX: trackPositionToOffsetX(e.clientX) })
    },
    [trackPositionToOffsetX, setViewport],
  )

  const handleThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingThumb(true)
      dragStartRef.current = { mouseX: e.clientX, offsetX: viewport.offsetX }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [viewport.offsetX],
  )

  const handleThumbPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingThumb) return
      const { totalPx } = contentExtent
      const maxScroll = totalPx - containerWidth
      if (maxScroll <= 0) return

      const thumbWidth = Math.max((containerWidth / totalPx) * containerWidth, MIN_THUMB_WIDTH)
      const scrollableTrack = containerWidth - thumbWidth
      const deltaMousePx = e.clientX - dragStartRef.current.mouseX
      // Convert mouse delta to content delta
      const deltaContent = (deltaMousePx / scrollableTrack) * maxScroll
      const newOffsetX = dragStartRef.current.offsetX - deltaContent
      setViewport({ offsetX: newOffsetX })
    },
    [draggingThumb, contentExtent, containerWidth, setViewport],
  )

  const handleThumbPointerUp = useCallback(() => {
    setDraggingThumb(false)
  }, [])

  useGesture(
    {
      onDrag: ({ delta: [dx] }) => {
        setViewport({ offsetX: viewport.offsetX + dx })
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey) {
          const factor = dy > 0 ? 0.9 : 1.1
          const newPpd = clampPixelsPerDay(viewport.pixelsPerDay * factor)
          setPixelsPerDay(newPpd)
        } else {
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
              style={{ textTransform: 'uppercase' }}
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

      {/* Horizontal scrollbar */}
      {scrollbar.visible && (
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{
            position: 'relative',
            height: SCROLLBAR_HEIGHT,
            marginTop: 2,
            cursor: 'pointer',
          }}
        >
          {/* Track */}
          <div
            style={{
              position: 'absolute',
              top: (SCROLLBAR_HEIGHT - SCROLLBAR_TRACK_HEIGHT) / 2,
              left: 0,
              right: 0,
              height: SCROLLBAR_TRACK_HEIGHT,
              borderRadius: SCROLLBAR_TRACK_HEIGHT / 2,
              backgroundColor: 'hsl(var(--muted))',
            }}
          />
          {/* Thumb */}
          <div
            data-scroll-thumb="true"
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerUp}
            style={{
              position: 'absolute',
              top: (SCROLLBAR_HEIGHT - SCROLLBAR_TRACK_HEIGHT) / 2,
              left: scrollbar.thumbLeft,
              width: scrollbar.thumbWidth,
              height: SCROLLBAR_TRACK_HEIGHT,
              borderRadius: SCROLLBAR_TRACK_HEIGHT / 2,
              backgroundColor: draggingThumb
                ? 'hsl(var(--foreground))'
                : 'hsl(var(--muted-foreground))',
              opacity: draggingThumb ? 0.7 : 0.5,
              cursor: 'grab',
              touchAction: 'none',
              transition: draggingThumb ? 'none' : 'opacity 0.15s',
            }}
          />
        </div>
      )}
    </div>
  )
}
