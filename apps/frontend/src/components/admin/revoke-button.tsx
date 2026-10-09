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
      variant="danger"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
