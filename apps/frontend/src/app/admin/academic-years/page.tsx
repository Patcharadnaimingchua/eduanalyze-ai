'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAcademicYears, fetchSemesters } from '@/lib/api/academic-record';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { AcademicYearForm } from '@/components/admin/academic-year-form';
import { BulkAcademicYearForm } from '@/components/admin/bulk-academic-year-form';
import { AcademicYearCard } from '@/components/admin/academic-year-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

  const yearsQuery = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears });
  const semestersQuery = useQuery({ queryKey: ['semesters'], queryFn: fetchSemesters });

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    queryClient.invalidateQueries({ queryKey: ['semesters'] });
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
      <div>
        <h1 className="text-2xl font-semibold text-primary">ปีการศึกษาและภาคเรียน</h1>
        <p className="text-sm text-muted-foreground">
          จัดการปีการศึกษาและภาคเรียนที่ใช้ทั่วทั้งระบบ
        </p>
      </div>

      <BulkAcademicYearForm onCreated={refetchAll} />

      <AcademicYearForm onCreated={refetchAll} />

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

      {(yearsQuery.isError || semestersQuery.isError) && (
        <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      )}

      {yearsQuery.data && semestersQuery.data && (
        <div className="space-y-4">
          {yearsQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีปีการศึกษาในระบบ</p>
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
    </DashboardShell>
  );
}
