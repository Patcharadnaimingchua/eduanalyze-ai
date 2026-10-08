import { Button } from '@/components/ui/button';

// The secondary, light-red button that starts removing a role or a scope. The
// removal itself waits for the confirm dialog.
export function RevokeButton({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60 dark:hover:text-red-200"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
