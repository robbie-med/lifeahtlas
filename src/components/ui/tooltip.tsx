import { type ReactNode, useState } from 'react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm bg-foreground text-background rounded-md shadow-md whitespace-nowrap',
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
