import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// The box every /admin/** page shows for an error the API returned. A warning
// look (not the destructive red) so it reads in both themes, and role="alert"
// so a screen reader announces it when it appears.
export const WARNING_ALERT_CLASS = 'border-amber-300 bg-amber-50 text-amber-900';

export function ApiErrorAlert({
  message,
  onDismiss,
}: Readonly<{ message: string; onDismiss?: () => void }>) {
  return (
    <Alert role="alert" className={WARNING_ALERT_CLASS}>
      <div className="flex items-start justify-between gap-2">
        <AlertDescription>{message}</AlertDescription>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="ปิดข้อความนี้"
            className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </Alert>
  );
}
