import { useUIStore, ZOOM_PRESETS } from '@/stores/uiStore'
import { ZoomLevel } from '@/types'
import { cn } from '@/utils/cn'

const levels = [
  { value: ZoomLevel.Decade, label: '10y' },
  { value: ZoomLevel.Year, label: '1y' },
  { value: ZoomLevel.Month, label: '1m' },
  { value: ZoomLevel.Week, label: '1w' },
] as const

export function ZoomControl() {
  const zoomLevel = useUIStore((s) => s.zoomLevel)
  const setZoomLevel = useUIStore((s) => s.setZoomLevel)

  return (
    <div className="inline-flex rounded-md border bg-muted p-0.5">
      {levels.map((l) => (
        <button
          key={l.value}
          onClick={() => setZoomLevel(l.value)}
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded transition-colors',
            zoomLevel === l.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title={`Zoom: ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export { ZOOM_PRESETS }
