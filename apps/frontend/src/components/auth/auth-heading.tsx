import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';

// The h1 of every sign-in page, in the same type as the rest of the app.
export function AuthHeading({
  title,
  description,
}: Readonly<{ title: ReactNode; description?: ReactNode }>) {
  return <PageHeader className="mb-5" title={title} description={description} />;
}
