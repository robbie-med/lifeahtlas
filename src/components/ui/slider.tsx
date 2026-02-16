import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Slider = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn('w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary', className)}
      {...props}
    />
  ),
)
Slider.displayName = 'Slider'
