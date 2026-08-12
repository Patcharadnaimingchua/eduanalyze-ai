import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onValueChange: (value: number) => void;
}

// No shadcn Slider primitive in this project and no Radix slider
// dependency installed — wraps the native <input type="range"> instead
// of adding a new library for a single 1-5 discrete picker.
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-brand',
        className,
      )}
      {...props}
    />
  ),
);
Slider.displayName = 'Slider';
