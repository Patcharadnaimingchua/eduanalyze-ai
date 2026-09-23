import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { QueryProvider } from '@/lib/query-client';
import { ToastProvider } from '@/lib/toast-context';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'EduAnalyzeAI',
  description: 'Academic progress tracking and learning outcome analytics system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <ToastProvider>
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
