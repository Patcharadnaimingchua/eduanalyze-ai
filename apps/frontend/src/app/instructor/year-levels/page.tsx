'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { fetchInstructorYearLevels } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function InstructorYearLevelsPage() {
  return (
    <ProtectedRoute>
      <InstructorYearLevelsContent />
    </ProtectedRoute>
  );
}

function InstructorYearLevelsContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['instructor-year-levels'],
    queryFn: fetchInstructorYearLevels,
    enabled: isInstructor,
  });

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

  const buckets = query.data?.buckets ?? [];
  const totalStudents = buckets.reduce((sum, b) => sum + b.students.length, 0);

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <div>
          <h1 className="text-2xl font-semibold text-primary">ภาพรวมชั้นปี</h1>
          <p className="text-sm text-muted-foreground">
            นักศึกษาที่เคยเรียนวิชาของคุณ แบ่งตามชั้นปี (ไม่รวมนักศึกษาทั้งหลักสูตร)
          </p>
        </div>

        {query.isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        )}

        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>ไม่สามารถโหลดข้อมูลภาพรวมชั้นปีได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
          </Alert>
        )}

        {query.data && totalStudents === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีนักศึกษาที่เกี่ยวข้องกับวิชาที่คุณสอน</AlertDescription>
          </Alert>
        )}

        {query.data && totalStudents > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {buckets.map((bucket) => {
                const isExpanded = expandedLevel === bucket.yearLevel;
                return (
                  <button
                    key={bucket.yearLevel}
                    type="button"
                    onClick={() => setExpandedLevel(isExpanded ? null : bucket.yearLevel)}
                    className={cn(
                      'rounded-lg border p-4 text-left transition',
                      isExpanded
                        ? 'border-brand bg-brand-light'
                        : 'border-slate-200 hover:border-brand',
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <GraduationCap className="h-4 w-4 text-brand" />
                      {bucket.label}
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-primary">
                      {bucket.students.length}
                    </p>
                    <p className="text-xs text-muted-foreground">คน</p>
                  </button>
                );
              })}
            </div>

            {expandedLevel !== null && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    รายชื่อนักศึกษา — {buckets.find((b) => b.yearLevel === expandedLevel)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bucket = buckets.find((b) => b.yearLevel === expandedLevel);
                    if (!bucket || bucket.students.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          ไม่มีนักศึกษาในชั้นปีนี้
                        </p>
                      );
                    }
                    return (
                      <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                        {bucket.students.map((s) => (
                          <li
                            key={s.studentProfileId}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="text-muted-foreground">{s.studentCode}</span>{' '}
                              <span className="text-primary">{s.fullName}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              เข้าศึกษาปี {s.admissionYear}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
