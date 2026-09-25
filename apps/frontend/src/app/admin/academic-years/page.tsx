'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX2, Plus } from 'lucide-react';
import { fetchAcademicYears, fetchSemesters } from '@/lib/api/academic-record';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { AcademicYearForm } from '@/components/admin/academic-year-form';
import { BulkAcademicYearForm } from '@/components/admin/bulk-academic-year-form';
import { AcademicYearCard } from '@/components/admin/academic-year-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function AcademicYearsAdminPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="SUPER_ADMIN">
        <AcademicYearsAdminContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function AcademicYearsAdminContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState<'bulk' | 'single' | null>(null);

  const yearsQuery = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears });
  const semestersQuery = useQuery({ queryKey: ['semesters'], queryFn: fetchSemesters });

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    queryClient.invalidateQueries({ queryKey: ['semesters'] });
  }

  function toggleForm(form: 'bulk' | 'single') {
    setOpenForm((current) => (current === form ? null : form));
  }

  function handleSingleCreated() {
    setOpenForm(null);
    refetchAll();
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <DashboardShell role="SUPER_ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="ปีการศึกษาและภาคเรียน"
          description="จัดการปีการศึกษาและภาคเรียนที่ใช้ทั่วทั้งระบบ"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={openForm === 'bulk' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() => toggleForm('bulk')}
              >
                <Plus size={16} />
                สร้างหลายปี
              </Button>
              <Button
                type="button"
                variant={openForm === 'single' ? 'default' : 'outline'}
                className="gap-1.5"
                onClick={() => toggleForm('single')}
              >
                <Plus size={16} />
                เพิ่มปีการศึกษา
              </Button>
            </div>
          }
        />
      </Reveal>

      {/* Bulk stays open after submit: it renders a per-year created/skipped/
          failed table that closing it would throw away. */}
      {openForm === 'bulk' && (
        <Reveal className="space-y-2">
          <BulkAcademicYearForm onCreated={refetchAll} />
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpenForm(null)}>
            ปิดฟอร์ม
          </Button>
        </Reveal>
      )}
      {openForm === 'single' && (
        <Reveal>
          <AcademicYearForm onCreated={handleSingleCreated} />
        </Reveal>
      )}

      <Reveal index={1}>
        <PageSection title="ปีการศึกษาทั้งหมด">
          {(yearsQuery.isLoading || semestersQuery.isLoading) && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(yearsQuery.isError || semestersQuery.isError) && <PageLoadError />}

          {yearsQuery.data && semestersQuery.data && (
            <div className="space-y-4">
              {yearsQuery.data.length === 0 ? (
                <EmptyState icon={CalendarX2} description="ยังไม่มีปีการศึกษาในระบบ" />
              ) : (
                [...yearsQuery.data]
                  .sort((a, b) => b.year - a.year)
                  .map((year) => (
                    <AcademicYearCard
                      key={year.id}
                      academicYear={year}
                      semesters={semestersQuery.data.filter((s) => s.academicYearId === year.id)}
                      onChanged={refetchAll}
                    />
                  ))
              )}
            </div>
          )}
        </PageSection>
      </Reveal>
    </DashboardShell>
  );
}
