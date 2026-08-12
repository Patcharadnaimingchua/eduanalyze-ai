'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck2, GraduationCap } from 'lucide-react';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchCreditCheck } from '@/lib/api/credit-checker';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { CategoryProgressList } from '@/components/credit-checker/category-progress-list';
import { MissingCoursesList } from '@/components/credit-checker/missing-courses-list';
import { FailedCoursesList } from '@/components/credit-checker/failed-courses-list';
import { PrerequisiteFlowChart } from '@/components/credit-checker/prerequisite-flow-chart';

export default function CreditCheckerPage() {
  return (
    <ProtectedRoute>
      <CreditCheckerContent />
    </ProtectedRoute>
  );
}

function CreditCheckerContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;

  const reportQuery = useQuery({
    queryKey: ['credit-check', studentProfileId],
    queryFn: () => fetchCreditCheck(studentProfileId!),
    enabled: !!studentProfileId,
  });

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

  if (profileQuery.isLoading || reportQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (profileQuery.isError || reportQuery.isError || !profileQuery.data || !reportQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const report = reportQuery.data;

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ระบบตรวจสอบเครดิตอัจฉริยะ</h1>
        <p className="text-sm text-muted-foreground">
          ตรวจสอบความคืบหน้าการเรียนเทียบกับโครงสร้างหลักสูตรของคุณแบบละเอียด
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={FileCheck2}
          label="หน่วยกิตสะสม"
          value={report.creditsPassed}
          suffix={`/ ${report.totalCreditsRequired}`}
        />
        <StatCard icon={Award} label="หน่วยกิตที่เหลือ" value={report.creditsRemaining} />
        <StatCard
          icon={GraduationCap}
          label="วิชาบังคับที่ยังขาด"
          value={report.graduationReadiness.missingRequiredCount}
          suffix="วิชา"
          badge={
            report.graduationReadiness.isReady
              ? { text: 'พร้อมสำเร็จการศึกษา', tone: 'positive' }
              : { text: 'ยังไม่พร้อม', tone: 'neutral' }
          }
        />
      </div>

      <CategoryProgressList categories={report.categoryProgress} />
      <MissingCoursesList courses={report.missingRequiredCourses} />
      <FailedCoursesList courses={report.failedCourses} />
      <PrerequisiteFlowChart report={report} />
    </DashboardShell>
  );
}
