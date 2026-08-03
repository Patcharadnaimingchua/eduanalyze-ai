import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
