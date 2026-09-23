'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CurriculumListItem } from '@eduanalyze-ai/shared-types';
import { createCurriculum, deleteCurriculum, updateCurriculum } from '@/lib/api/organization';
import { curriculumSchema, type CurriculumFormValues } from '@/lib/validation/organization.schema';
import { describeOrgWriteError } from './org-errors';
import { DeactivateButton } from './deactivate-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const VERSION_CONFLICT = 'เวอร์ชันหลักสูตรนี้มีอยู่แล้วในสาขานี้';

const FIELDS: { name: keyof CurriculumFormValues; label: string; type: 'text' | 'number' }[] = [
  { name: 'version', label: 'เวอร์ชัน', type: 'text' },
  { name: 'effectiveYear', label: 'ปีที่เริ่มใช้', type: 'number' },
  { name: 'totalCredits', label: 'หน่วยกิตรวม', type: 'number' },
  { name: 'maxCreditsPerSemester', label: 'หน่วยกิตสูงสุด/ภาค', type: 'number' },
  { name: 'defaultAchievementThreshold', label: 'เกณฑ์ผ่าน CLO (%)', type: 'number' },
];

export function CurriculumPanel({
  programId,
  curricula,
  onChanged,
}: {
  programId: string;
  curricula: CurriculumListItem[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const sorted = [...curricula].sort((a, b) => b.effectiveYear - a.effectiveYear);

  return (
    <div className="space-y-2">
      {sorted.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีหลักสูตรในสาขานี้</p>}
      {sorted.map((curriculum) => (
        <CurriculumCard key={curriculum.id} curriculum={curriculum} onChanged={onChanged} />
      ))}
      {adding ? (
        <CurriculumForm
          submitLabel="เพิ่มหลักสูตร"
          defaultValues={{
            version: '',
            effectiveYear: new Date().getFullYear() + 543,
            totalCredits: 0,
            maxCreditsPerSemester: 22,
            defaultAchievementThreshold: 70,
          }}
          onSubmit={async (values) => {
            await createCurriculum({ ...values, programId });
            setAdding(false);
            onChanged();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          + เพิ่มหลักสูตร
        </Button>
      )}
    </div>
  );
}

function CurriculumCard({
  curriculum,
  onChanged,
}: {
  curriculum: CurriculumListItem;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function toggleRegistration() {
    setToggling(true);
    setToggleError(null);
    try {
      await updateCurriculum(curriculum.id, {
        isOpenForRegistration: !curriculum.isOpenForRegistration,
      });
      onChanged();
    } catch (error) {
      setToggleError(describeOrgWriteError(error, VERSION_CONFLICT));
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">หลักสูตร</span>
            <span className="text-sm font-medium text-primary">
              ฉบับ {curriculum.version} (ปี {curriculum.effectiveYear})
            </span>
            <Badge tone={curriculum.isOpenForRegistration ? 'success' : 'neutral'}>
              {curriculum.isOpenForRegistration ? 'เปิดรับลงทะเบียน' : 'ปิดรับลงทะเบียน'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {curriculum.totalCredits} หน่วยกิตรวม · สูงสุด {curriculum.maxCreditsPerSemester} หน่วยกิต/ภาค ·
            เกณฑ์ผ่าน CLO {curriculum.defaultAchievementThreshold}%
          </p>
        </div>
        <div className="flex items-start gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={toggling} onClick={toggleRegistration}>
            {curriculum.isOpenForRegistration ? 'ปิดรับลงทะเบียน' : 'เปิดรับลงทะเบียน'}
          </Button>
          {!editing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              แก้ไข
            </Button>
          )}
          <DeactivateButton
            conflictMessage="ปิดใช้งานไม่ได้ เพราะยังมีนักศึกษา รายวิชา หมวดวิชา หรือ PLO ที่ใช้งานอยู่ในหลักสูตรนี้"
            onConfirm={async () => {
              await deleteCurriculum(curriculum.id);
              onChanged();
            }}
          />
        </div>
      </div>
      {!curriculum.isOpenForRegistration && (
        <p className="mt-1 text-xs text-amber-700">
          การเปิดรับลงทะเบียนจะปิดรับหลักสูตรอื่นในสาขานี้โดยอัตโนมัติ
        </p>
      )}
      {toggleError && <p className="mt-1 text-xs text-destructive">{toggleError}</p>}

      {editing && (
        <div className="mt-2">
          <CurriculumForm
            submitLabel="บันทึก"
            defaultValues={{
              version: curriculum.version,
              effectiveYear: curriculum.effectiveYear,
              totalCredits: curriculum.totalCredits,
              maxCreditsPerSemester: curriculum.maxCreditsPerSemester,
              defaultAchievementThreshold: curriculum.defaultAchievementThreshold,
            }}
            onSubmit={async (values) => {
              await updateCurriculum(curriculum.id, values);
              setEditing(false);
              onChanged();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

function CurriculumForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: CurriculumFormValues;
  submitLabel: string;
  onSubmit: (values: CurriculumFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CurriculumFormValues>({
    resolver: zodResolver(curriculumSchema),
    defaultValues,
  });

  async function handleSubmit(values: CurriculumFormValues) {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(describeOrgWriteError(error, VERSION_CONFLICT));
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
      >
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input type={f.type} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'กำลังบันทึก...' : submitLabel}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </Form>
  );
}
