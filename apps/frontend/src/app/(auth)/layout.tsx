import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <ThemeToggle className="fixed right-4 top-4 z-30" />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
