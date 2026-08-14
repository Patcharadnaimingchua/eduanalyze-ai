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
  UserRound,
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
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50/80 p-3.5 transition-colors hover:bg-brand-light/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-primary" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full border-slate-200/80 shadow-sm">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-lg text-primary">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
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
  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <DashboardShell studentCode={profile.studentCode} fullName={user.fullName}>
      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationFillMode: 'both' }}
      >
        <Card className="relative overflow-hidden border-brand-light bg-gradient-to-br from-brand-light via-white to-white shadow-sm">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand/5" aria-hidden="true" />
          <CardContent className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-bold tracking-wide text-brand-foreground shadow-sm ring-4 ring-white sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-brand">โปรไฟล์ของฉัน</p>
              <h1 className="truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl" title={user.fullName}>
                {user.fullName}
              </h1>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={user.email}>
                {user.email}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                  <GraduationCap size={14} aria-hidden="true" />
                  นักศึกษา
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                  <Hash size={13} aria-hidden="true" />
                  {profile.studentCode}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <ProfileSection icon={UserRound} title="ข้อมูลส่วนตัว" description="รายละเอียดบัญชีและข้อมูลสำหรับติดต่อ">
            <ProfileItem icon={UserRound} label="ชื่อ-นามสกุล" value={user.fullName} />
            <ProfileItem icon={Mail} label="อีเมล" value={user.email} />
            <ProfileItem icon={Hash} label="รหัสนิสิต/นักศึกษา" value={profile.studentCode} />
          </ProfileSection>
        </div>

        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '175ms', animationFillMode: 'both' }}
        >
          <ProfileSection icon={GraduationCap} title="ข้อมูลการศึกษา" description="หลักสูตรและหน่วยงานการศึกษาปัจจุบัน">
            <ProfileItem icon={Landmark} label="คณะ" value={faculty?.name ?? '—'} />
            <ProfileItem icon={Building2} label="ภาควิชา" value={department?.name ?? '—'} />
            <ProfileItem icon={GraduationCap} label="สาขา" value={program?.name ?? '—'} />
            <ProfileItem
              icon={BookOpen}
              label="หลักสูตร"
              value={curriculum ? `${curriculum.version} (พ.ศ. ${curriculum.effectiveYear})` : '—'}
            />
            <ProfileItem icon={CalendarDays} label="ปีที่เข้าศึกษา" value={`${profile.admissionYear}`} />
          </ProfileSection>
        </div>
      </div>
    </DashboardShell>
  );
}
