'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import {
  fetchCurricula,
  fetchDepartments,
  fetchFaculties,
  fetchPrograms,
} from '@/lib/api/organization';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSkeleton } from '@/components/profile/profile-skeleton';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-primary">{value}</span>
    </div>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties, enabled: isStudent });
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: isStudent,
  });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms, enabled: isStudent });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula, enabled: isStudent });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">หน้านี้สำหรับนักศึกษาเท่านั้น</p>
      </div>
    );
  }

  const isLoading =
    profileQuery.isLoading ||
    facultiesQuery.isLoading ||
    departmentsQuery.isLoading ||
    programsQuery.isLoading ||
    curriculaQuery.isLoading;

  if (isLoading) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <ProfileSkeleton />
      </DashboardShell>
    );
  }

  if (
    profileQuery.isError ||
    facultiesQuery.isError ||
    departmentsQuery.isError ||
    programsQuery.isError ||
    curriculaQuery.isError ||
    !profileQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const profile = profileQuery.data;
  const program = programsQuery.data!.find((p) => p.id === profile.programId);
  const department = program ? departmentsQuery.data!.find((d) => d.id === program.departmentId) : undefined;
  const faculty = department ? facultiesQuery.data!.find((f) => f.id === department.facultyId) : undefined;
  const curriculum = curriculaQuery.data!.find((c) => c.id === profile.curriculumId);

  return (
    <DashboardShell studentCode={profile.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">โปรไฟล์ของฉัน</h1>
        <p className="text-sm text-muted-foreground">ข้อมูลนิสิต/นักศึกษาของคุณ</p>
      </div>

      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '75ms', animationFillMode: 'both' }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileRow label="ชื่อ-นามสกุล" value={user.fullName} />
            <ProfileRow label="อีเมล" value={user.email} />
            <ProfileRow label="รหัสนิสิต/นักศึกษา" value={profile.studentCode} />
            <ProfileRow label="คณะ" value={faculty?.name ?? '—'} />
            <ProfileRow label="ภาควิชา" value={department?.name ?? '—'} />
            <ProfileRow label="สาขา" value={program?.name ?? '—'} />
            <ProfileRow
              label="หลักสูตร"
              value={curriculum ? `${curriculum.version} (พ.ศ. ${curriculum.effectiveYear})` : '—'}
            />
            <ProfileRow label="ปีที่เข้าศึกษา" value={`${profile.admissionYear}`} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
