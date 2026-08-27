'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentProfiles } from '@/lib/api/staff';
import { fetchCurricula, fetchPrograms } from '@/lib/api/organization';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StudentDirectoryTable } from '@/components/staff/student-directory-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

export default function StaffStudentsPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        <StaffStudentsContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffStudentsContent() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const studentsQuery = useQuery({ queryKey: ['staff-students'], queryFn: fetchStudentProfiles });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const filteredStudents = (studentsQuery.data ?? []).filter((student) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      student.user.fullName.toLowerCase().includes(term) ||
      student.studentCode.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ทำเนียบนักศึกษา</h1>
        <p className="text-sm text-muted-foreground">นักศึกษาในขอบเขตความรับผิดชอบของคุณ</p>
      </div>

      <Input
        placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {studentsQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      {studentsQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
        </Alert>
      )}
      {studentsQuery.data && (
        <StudentDirectoryTable
          students={filteredStudents}
          programs={programsQuery.data ?? []}
          curricula={curriculaQuery.data ?? []}
        />
      )}
    </DashboardShell>
  );
}
