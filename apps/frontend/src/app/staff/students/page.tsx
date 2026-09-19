'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { fetchStaffStudentRisk } from '@/lib/api/staff';
import { fetchCurricula, fetchPrograms } from '@/lib/api/organization';
import { useAuth } from '@/lib/auth-context';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER } from '@/lib/risk-level';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StudentDirectoryTable } from '@/components/staff/student-directory-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Radix reserves '' for "no selection", so the all-levels option needs a
// value of its own — same sentinel the instructor gradebook uses.
const ALL_RISK_LEVELS = 'ALL';

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
  const [riskFilter, setRiskFilter] = useState<RiskLevel | typeof ALL_RISK_LEVELS>(
    ALL_RISK_LEVELS,
  );

  const studentsQuery = useQuery({
    queryKey: ['staff-student-risk'],
    queryFn: fetchStaffStudentRisk,
  });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });

  const allStudents = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allStudents.filter(
      (student) =>
        (riskFilter === ALL_RISK_LEVELS || student.riskLevel === riskFilter) &&
        (term === '' ||
          student.fullName.toLowerCase().includes(term) ||
          student.studentCode.toLowerCase().includes(term)),
    );
  }, [allStudents, search, riskFilter]);
  const isFiltered = search.trim() !== '' || riskFilter !== ALL_RISK_LEVELS;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ทำเนียบนักศึกษา</h1>
        <p className="text-sm text-muted-foreground">นักศึกษาในขอบเขตความรับผิดชอบของคุณ</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={riskFilter}
          onValueChange={(value) =>
            setRiskFilter(value as RiskLevel | typeof ALL_RISK_LEVELS)
          }
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RISK_LEVELS}>ทุกระดับ</SelectItem>
            {RISK_LEVEL_ORDER.map((level) => (
              <SelectItem key={level} value={level}>
                {RISK_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <span className="text-sm text-muted-foreground">
            แสดง {filteredStudents.length} จาก {allStudents.length} คน
          </span>
        )}
      </div>

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
