'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  // Separate from `label` so callers can search a superset of what's
  // displayed (e.g. code + name together) without changing the visible text.
  searchText: string;
}

interface ComboboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  options: ComboboxOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

// Generic searchable-select — no combobox/autocomplete library exists in
// this project, built on @radix-ui/react-popover (same family already
// trusted via react-select) rather than hand-rolling focus/click-outside/
// keyboard handling from scratch. forwardRef + ...props (id/aria-*) so it
// slots into <FormControl> (Radix Slot) the same way every other form
// primitive here does.
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'เลือก...',
      searchPlaceholder = 'ค้นหา...',
      emptyText = 'ไม่พบรายการที่ตรงกัน',
      ...triggerProps
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');

    const selected = options.find((o) => o.value === value);
    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((o) => o.searchText.toLowerCase().includes(q));
    }, [options, query]);

    return (
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery('');
        }}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...triggerProps}
          >
            <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
          className="z-50 w-[--radix-popover-trigger-width] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus:bg-accent"
              >
                <Check
                  size={14}
                  className={cn('shrink-0', option.value === value ? 'opacity-100' : 'opacity-0')}
                />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
    );
  },
);
Combobox.displayName = 'Combobox';
