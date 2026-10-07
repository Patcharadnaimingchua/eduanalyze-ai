'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

// A side panel for the Staff forms that do not fit in a table row. Full width
// on a phone, a column on the right from sm up. components/ui/sheet.tsx is the
// shell's menu drawer (its title is fixed to "เมนู", its width to 18rem), so
// this one carries its own title.
export function StaffSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}>) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-background shadow-lg outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none sm:max-w-xl"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-background px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="break-words text-lg font-semibold text-primary">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="break-words text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="ปิดหน้าต่าง"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-50"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="space-y-6 px-4 py-5 sm:px-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
