import { Alert, AlertDescription } from '@/components/ui/alert';

// The box every /admin/** page shows for an error the API returned. A warning
// look (not the destructive red) so it reads in both themes, and role="alert"
// so a screen reader announces it when it appears.
export const WARNING_ALERT_CLASS =
  'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200';

export function ApiErrorAlert({ message }: Readonly<{ message: string }>) {
  return (
    <Alert role="alert" className={WARNING_ALERT_CLASS}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
