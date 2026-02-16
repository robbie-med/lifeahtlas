import { useUIStore } from '@/stores/uiStore'
import { PresentationMode } from '@/types'
import { cn } from '@/utils/cn'

const modes = [
  { value: PresentationMode.Strategic, label: 'Strategic' },
  { value: PresentationMode.Shared, label: 'Shared' },
  { value: PresentationMode.Narrative, label: 'Narrative' },
] as const

export function ModeToggle() {
  const mode = useUIStore((s) => s.presentationMode)
  const setMode = useUIStore((s) => s.setPresentationMode)

  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            mode === m.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
