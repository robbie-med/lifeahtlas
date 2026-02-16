import { differenceInDays, parseISO, addYears, addMonths, startOfYear, startOfMonth, startOfWeek, format } from 'date-fns'
import type { Phase, ViewportState } from '@/types'

// ── Coordinate conversion ──

export function dateToPixel(date: Date, origin: Date, pixelsPerDay: number): number {
  return differenceInDays(date, origin) * pixelsPerDay
}

export function pixelToDate(px: number, origin: Date, pixelsPerDay: number): Date {
  const days = Math.round(px / pixelsPerDay)
  return new Date(origin.getTime() + days * 86400000)
}

// ── Axis tick generation ──

export interface AxisTick {
  date: Date
  label: string
  x: number
  isMajor: boolean
}

export function getAxisTicks(
  origin: Date,
  viewport: ViewportState,
  canvasWidth: number,
): AxisTick[] {
  const ppd = viewport.pixelsPerDay
  const startPx = -viewport.offsetX
  const endPx = startPx + canvasWidth

  const startDate = pixelToDate(startPx, origin, ppd)
  const endDate = pixelToDate(endPx, origin, ppd)
  const ticks: AxisTick[] = []

  if (ppd < 0.3) {
    // Decade view: major = decade, minor = year
    let d = startOfYear(startDate)
    while (d <= endDate) {
      const x = dateToPixel(d, origin, ppd) + viewport.offsetX
      const yr = d.getFullYear()
      ticks.push({
        date: new Date(d),
        label: format(d, 'yyyy'),
        x,
        isMajor: yr % 10 === 0,
      })
      d = addYears(d, 1)
    }
  } else if (ppd < 5) {
    // Year view: major = year, minor = month
    let d = startOfMonth(startDate)
    while (d <= endDate) {
      const x = dateToPixel(d, origin, ppd) + viewport.offsetX
      ticks.push({
        date: new Date(d),
        label: d.getMonth() === 0 ? format(d, 'yyyy') : format(d, 'MMM'),
        x,
        isMajor: d.getMonth() === 0,
      })
      d = addMonths(d, 1)
    }
  } else if (ppd < 30) {
    // Month view: major = month, minor = week
    let d = startOfWeek(startDate)
    while (d <= endDate) {
      const x = dateToPixel(d, origin, ppd) + viewport.offsetX
      const isFirst = d.getDate() <= 7
      ticks.push({
        date: new Date(d),
        label: isFirst ? format(d, 'MMM yyyy') : format(d, 'MMM d'),
        x,
        isMajor: isFirst,
      })
      d = new Date(d.getTime() + 7 * 86400000)
    }
  } else {
    // Week view: major = week start, minor = day
    let d = startOfWeek(startDate)
    while (d <= endDate) {
      const x = dateToPixel(d, origin, ppd) + viewport.offsetX
      ticks.push({
        date: new Date(d),
        label: format(d, 'EEE, MMM d'),
        x,
        isMajor: d.getDay() === 0,
      })
      d = new Date(d.getTime() + 86400000)
    }
  }

  return ticks
}

// ── Phase layout ──

export interface PhaseLayout {
  phase: Phase
  x: number
  width: number
  row: number
}

const CATEGORY_ROW_ORDER: string[] = [
  'career', 'education', 'family', 'relationship', 'caregiving', 'health', 'biologic-rhythms', 'housing', 'financial', 'personal',
]

export function getPhaseLayout(
  phases: Phase[],
  origin: Date,
  pixelsPerDay: number,
): PhaseLayout[] {
  // Group by category, assign row per category
  const categoryRows = new Map<string, number>()
  let nextRow = 0
  for (const cat of CATEGORY_ROW_ORDER) {
    if (phases.some((p) => p.category === cat)) {
      categoryRows.set(cat, nextRow++)
    }
  }

  return phases.map((phase) => {
    const start = parseISO(phase.startDate)
    const end = parseISO(phase.endDate)
    const x = dateToPixel(start, origin, pixelsPerDay)
    const width = Math.max(differenceInDays(end, start) * pixelsPerDay, 4)
    const row = categoryRows.get(phase.category) ?? 0

    return { phase, x, width, row }
  })
}

// ── Spatial culling ──

export function getVisiblePhases(
  layouts: PhaseLayout[],
  viewport: ViewportState,
  canvasWidth: number,
): PhaseLayout[] {
  const startPx = -viewport.offsetX
  const endPx = startPx + canvasWidth

  return layouts.filter((l) => {
    const phaseEnd = l.x + l.width
    return phaseEnd >= startPx && l.x <= endPx
  })
}

// ── Zoom helpers ──

export const ZOOM_PX_PER_DAY = {
  decade: 0.05,
  year: 1,
  month: 10,
  week: 50,
} as const

export function clampPixelsPerDay(ppd: number): number {
  return Math.max(0.01, Math.min(100, ppd))
}
