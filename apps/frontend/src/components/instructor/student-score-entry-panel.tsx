'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssessmentScoreStatus } from '@eduanalyze-ai/shared-types';
import {
  fetchStudentAssessmentScores,
  upsertStudentAssessmentScore,
} from '@/lib/api/assessment-evidence';
import { fetchCourseRoster } from '@/lib/api/instructor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvidenceCoverageBadge } from './evidence-coverage-badge';

const STATUS_OPTIONS: { value: AssessmentScoreStatus; label: string }[] = [
  { value: 'PENDING', label: 'ยังไม่ตรวจ' },
  { value: 'GRADED', label: 'ตรวจแล้ว' },
  { value: 'ABSENT', label: 'ขาดสอบ' },
  { value: 'EXCUSED', label: 'ได้รับการยกเว้น' },
];

interface ScoreRow {
  studentProfileId: string;
  studentCourseRecordId: string;
  studentCode: string;
  fullName: string;
  status: AssessmentScoreStatus;
  // Kept as string in form state (input value), converted to number|undefined on submit.
  score: string;
}

export function StudentScoreEntryPanel({
  courseId,
  assessmentCloMappingId,
}: {
  courseId: string;
  assessmentCloMappingId: string;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rosterQuery = useQuery({
    queryKey: ['course-roster', courseId],
    queryFn: () => fetchCourseRoster(courseId),
  });
  const scoresQuery = useQuery({
    queryKey: ['student-assessment-scores', assessmentCloMappingId],
    queryFn: () => fetchStudentAssessmentScores(assessmentCloMappingId, courseId),
  });

  const form = useForm<{ rows: ScoreRow[] }>({ defaultValues: { rows: [] } });
  const { fields, replace } = useFieldArray({ control: form.control, name: 'rows' });

  // Seed once both roster and existing scores have loaded — re-seeds
  // (and drops any unsaved edits) whenever the selected mapping changes,
  // since assessmentCloMappingId is a queryKey dependency of scoresQuery.
  useEffect(() => {
    if (!rosterQuery.data || !scoresQuery.data) return;
    const scoreByRecordId = new Map(scoresQuery.data.map((s) => [s.studentCourseRecordId, s]));
    replace(
      rosterQuery.data.map((student) => {
        const existing = scoreByRecordId.get(student.studentCourseRecordId);
        return {
          studentProfileId: student.studentProfileId,
          studentCourseRecordId: student.studentCourseRecordId,
          studentCode: student.studentCode,
          fullName: student.fullName,
          status: existing?.status ?? 'PENDING',
          score: existing?.score ?? '',
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterQuery.data, scoresQuery.data]);

  const gradedCount = useMemo(
    () => fields.filter((f) => f.status === 'GRADED').length,
    [fields],
  );

  async function onSave() {
    setServerError(null);
    setSaving(true);
    try {
      const rows = form.getValues('rows');
      const dirtyIndexes = form.formState.dirtyFields.rows ?? [];
      const dirtyRows = rows.filter((_, index) => dirtyIndexes[index]);
      for (const row of dirtyRows) {
        await upsertStudentAssessmentScore({
          assessmentCloMappingId,
          studentCourseRecordId: row.studentCourseRecordId,
          status: row.status,
          score: row.status === 'GRADED' && row.score !== '' ? Number(row.score) : undefined,
          courseId,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ['student-assessment-scores', assessmentCloMappingId],
      });
      form.reset(form.getValues());
    } catch {
      setServerError('บันทึกคะแนนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  }

  const isLoading = rosterQuery.isLoading || scoresQuery.isLoading;
  const isError = rosterQuery.isError || scoresQuery.isError;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">กรอกคะแนนนักศึกษา</CardTitle>
        {fields.length > 0 && (
          <EvidenceCoverageBadge coverage={{ validCount: gradedCount, totalCount: fields.length }} />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
        {isError && <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้</p>}
        {!isLoading && !isError && fields.length === 0 && (
          <p className="text-sm text-muted-foreground">ยังไม่มีนักศึกษาลงทะเบียนในรายวิชานี้</p>
        )}

        {fields.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">รหัสนักศึกษา</th>
                  <th className="py-2 pr-4 font-medium">ชื่อ-นามสกุล</th>
                  <th className="py-2 pr-4 font-medium">สถานะ</th>
                  <th className="py-2 font-medium">คะแนน</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const status = form.watch(`rows.${index}.status`);
                  return (
                    <tr key={field.id} className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-muted-foreground">{field.studentCode}</td>
                      <td className="py-2 pr-4 text-primary">{field.fullName}</td>
                      <td className="py-2 pr-4">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          {...form.register(`rows.${index}.status`, {
                            onChange: (e) => {
                              if (e.target.value !== 'GRADED') {
                                form.setValue(`rows.${index}.score`, '', {
                                  shouldDirty: true,
                                });
                              }
                            },
                          })}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          disabled={status !== 'GRADED'}
                          className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          {...form.register(`rows.${index}.score`)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {fields.length > 0 && (
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกคะแนนทั้งหมด'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
