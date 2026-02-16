import { type ReactNode, useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function Sheet({ open, onClose, children, side = 'right', className }: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'fixed top-0 h-full w-[400px] bg-background border shadow-lg overflow-y-auto transition-transform p-6',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col space-y-2 mb-6', className)}>{children}</div>
}

export function SheetTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}
