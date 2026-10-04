'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const LENGTH = 6;

// Controlled 6-digit segmented input — plugs into react-hook-form the same
// way Input does (value/onChange pair), just split across boxes. Only used
// where the field is guaranteed to be exactly 6 digits (TwoFactorEnableDto);
// login's verify field also accepts recovery codes ("XXXX-XXXX") and stays
// a plain Input for that reason — see two-factor-section.tsx.
export function OtpInput({
  value,
  onChange,
  hasError,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');
  // Which box just received a digit, so it gets the entry-pop animation
  // once — cleared after the animation finishes so retyping the same box
  // (e.g. backspace then retype) restarts it instead of a no-op class toggle.
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit) {
      setPulseIndex(index);
      window.setTimeout(() => {
        setPulseIndex((current) => (current === index ? null : current));
      }, 220);
      if (index < LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className={cn('flex gap-2', hasError && 'animate-shake')}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'h-12 w-10 rounded-md border text-center text-lg font-semibold ring-offset-background transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50',
            digit
              ? 'border-slate-300 bg-gradient-to-b from-background to-brand-light/50 text-primary'
              : 'border-input bg-gradient-to-b from-background to-slate-50',
            'focus-visible:outline-none focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_hsl(var(--brand)/0.18),0_0_14px_3px_hsl(var(--brand)/0.35)]',
            hasError &&
              'border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_3px_hsl(var(--destructive)/0.18),0_0_14px_3px_hsl(var(--destructive)/0.35)]',
            pulseIndex === index && 'animate-otp-digit-pop motion-reduce:animate-none',
          )}
        />
      ))}
    </div>
  );
}
