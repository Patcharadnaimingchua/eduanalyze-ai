'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Hash,
  Landmark,
  Mail,
  type LucideIcon,
} from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSkeleton } from '@/components/profile/profile-skeleton';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-0.5 pt-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-semibold leading-5 text-primary">{value}</p>
      </div>
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
  const initial = user.fullName.trim().charAt(0).toUpperCase();

  return (
    <DashboardShell studentCode={profile.studentCode} fullName={user.fullName}>
      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationFillMode: 'both' }}
      >
        <Card className="border-slate-200 bg-gradient-to-br from-brand-light/70 via-white to-white shadow-sm">
          <CardContent className="flex flex-col gap-5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold tracking-wide text-brand-foreground shadow-sm ring-4 ring-white sm:h-20 sm:w-20 sm:text-2xl">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-sm font-medium text-brand">ข้อมูลส่วนตัว</p>
                <h1 className="break-words text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  {user.fullName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                    <GraduationCap size={14} aria-hidden="true" />
                    นักศึกษา
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
                    <Hash size={13} aria-hidden="true" />
                    {profile.studentCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3 rounded-lg bg-white/70 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
                <Mail size={16} aria-hidden="true" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-medium text-muted-foreground">อีเมล</p>
                <p className="break-all text-sm font-medium leading-5 text-primary">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
              <GraduationCap size={20} aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg text-primary">ข้อมูลการศึกษา</CardTitle>
              <CardDescription className="mt-1">หลักสูตรและหน่วยงานการศึกษาปัจจุบัน</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileItem icon={Landmark} label="คณะ" value={faculty?.name ?? '—'} />
            <ProfileItem icon={Building2} label="ภาควิชา" value={department?.name ?? '—'} />
            <ProfileItem icon={GraduationCap} label="สาขา" value={program?.name ?? '—'} />
            <ProfileItem
              icon={BookOpen}
              label="หลักสูตร"
              value={curriculum ? `${curriculum.version} (พ.ศ. ${curriculum.effectiveYear})` : '—'}
            />
            <ProfileItem icon={CalendarDays} label="ปีที่เข้าศึกษา" value={`${profile.admissionYear}`} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
