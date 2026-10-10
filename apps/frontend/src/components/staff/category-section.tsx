'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { AlertTriangle, CheckCircle2, ChevronDown, Info } from 'lucide-react';
import {
  createCurriculumRequirement,
  deleteCourseCategory,
  deleteCurriculumRequirement,
  updateCurriculumRequirement,
} from '@/lib/api/staff';
import {
  curriculumRequirementSchema,
  type CurriculumRequirementFormValues,
} from '@/lib/validation/curriculum-requirement.schema';
import { describeApiError } from '@/lib/describe-api-error';
import { CATEGORY_DELETE_BLOCKED } from './course-edit';
import { OWN_SENTENCE_ONLY, STAFF_WRITE_ERRORS } from '@/lib/api-error-presets';
import { useToast } from '@/lib/toast-context';
import { creditShare } from '@/lib/progress-ring-geometry';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedRing } from '@/components/ui/animated-ring';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CategoryMenu } from './category-menu';
import { categorySummary, creditStatus, type CategoryBlock } from './curriculum-view';

// The credit rule for a category compared with what the curriculum offers in
// it. This is about the curriculum's own content, not about any student.
const STATUS_STYLE = {
  met: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  short: 'border-amber-200 bg-amber-50 text-amber-700',
  over: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

const SMALL = 'h-11 px-4';

// One category: its name, its credit rule and the writes that belong to it
// (set/edit/remove the rule, remove the category). The course rows go inside.
export function CategorySection({
  block,
  expanded,
  onToggle,
  onChanged,
  children,
}: Readonly<{
  block: CategoryBlock;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
  children: React.ReactNode;
}>) {
  const { category, requirement } = block;
  const bodyId = useId();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingCategoryDelete, setConfirmingCategoryDelete] = useState(false);
  const [confirmingRequirementDelete, setConfirmingRequirementDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const status = requirement ? creditStatus(block.credits, requirement.minCredits) : null;
  const share = creditShare(block.credits, requirement?.minCredits);

  const form = useForm<CurriculumRequirementFormValues>({
    resolver: zodResolver(curriculumRequirementSchema),
    defaultValues: {
      minCredits: requirement?.minCredits,
      minCourses: requirement?.minCourses ?? undefined,
    },
  });
  const formOpen = editing || !requirement;

  function startEditing() {
    if (!expanded) onToggle();
    setEditing(true);
  }

  // Flow that writes: DELETE /course-categories/:id
  async function handleDeleteCategory() {
    setBusy(true);
    setServerError(null);
    try {
      await deleteCourseCategory(category.id);
      toast.success('ลบหมวดวิชาแล้ว');
      onChanged();
    } catch (error) {
      setConfirmingCategoryDelete(false);
      setServerError(
        isAxiosError(error) && error.response?.status === 409
          ? CATEGORY_DELETE_BLOCKED
          : describeApiError(error, STAFF_WRITE_ERRORS, undefined, OWN_SENTENCE_ONLY),
      );
    } finally {
      setBusy(false);
    }
  }

  // Flow that writes: DELETE /curriculum-requirements/:id
  async function handleDeleteRequirement() {
    if (!requirement) return;
    setBusy(true);
    setServerError(null);
    try {
      await deleteCurriculumRequirement(requirement.id);
      toast.success('ลบเกณฑ์หน่วยกิตแล้ว');
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, STAFF_WRITE_ERRORS, undefined, OWN_SENTENCE_ONLY));
    } finally {
      setConfirmingRequirementDelete(false);
      setBusy(false);
    }
  }

  // Flow that writes: POST / PATCH /curriculum-requirements
  async function onSubmitRequirement(values: CurriculumRequirementFormValues) {
    setServerError(null);
    try {
      if (requirement) {
        await updateCurriculumRequirement(requirement.id, values);
        setEditing(false);
      } else {
        await createCurriculumRequirement({
          curriculumId: category.curriculumId,
          categoryId: category.id,
          ...values,
        });
      }
      toast.success('บันทึกเกณฑ์หน่วยกิตแล้ว');
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, STAFF_WRITE_ERRORS, undefined, OWN_SENTENCE_ONLY));
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="w-full min-w-0 text-lg font-semibold text-primary md:w-auto md:flex-1">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={onToggle}
              className="flex min-h-11 w-full items-start gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown
                aria-hidden="true"
                className={`mt-1.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${
                  expanded ? '' : '-rotate-90'
                }`}
              />
              <span className="min-w-0">
                <span className="block break-words">
                  {category.name}
                  {category.code && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({category.code})
                    </span>
                  )}
                </span>
                <span className="block text-sm font-normal tabular-nums text-muted-foreground">
                  {categorySummary(block.courseCount, block.withoutInstructor)}
                </span>
              </span>
            </button>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {status && requirement && (
              <>
                {share !== null && (
                  <span
                    role="img"
                    aria-label={`หน่วยกิตที่มีในหมวด ${block.credits} จากเกณฑ์ ${requirement.minCredits}`}
                    title={`หน่วยกิตที่มีในหมวด จากเกณฑ์ ${requirement.minCredits}`}
                    className="shrink-0"
                  >
                    <AnimatedRing
                      percent={share}
                      size={56}
                      strokeWidth={6}
                      tone={status.kind === 'over' ? 'neutral' : 'default'}
                    >
                      <span className="text-[10px] font-semibold tabular-nums text-primary">
                        {block.credits}/{requirement.minCredits}
                      </span>
                    </AnimatedRing>
                  </span>
                )}
                <span
                  className={`inline-flex min-h-7 items-start gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status.kind]}`}
                >
                  {status.kind === 'met' && (
                    <CheckCircle2 aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
                  )}
                  {status.kind === 'short' && (
                    <AlertTriangle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
                  )}
                  {status.kind === 'over' && (
                    <Info aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="break-words">{status.label}</span>
                </span>
                {requirement.minCourses != null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    อย่างน้อย {requirement.minCourses} วิชา
                  </span>
                )}
              </>
            )}
            <CategoryMenu
              categoryName={category.name}
              onEditRule={requirement && !editing ? startEditing : undefined}
              onDeleteRule={
                requirement && !editing ? () => setConfirmingRequirementDelete(true) : undefined
              }
              onDeleteCategory={() => setConfirmingCategoryDelete(true)}
            />
          </div>
        </div>
        {confirmingRequirementDelete && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="min-w-0 flex-1 break-words font-semibold">
              ลบเกณฑ์หน่วยกิตของหมวดนี้?
            </span>
            <Button
              type="button"
              variant="destructive"
              className={SMALL}
              disabled={busy}
              onClick={handleDeleteRequirement}
            >
              ยืนยันลบเกณฑ์
            </Button>
            <Button
              type="button"
              variant="outline"
              className={SMALL}
              onClick={() => setConfirmingRequirementDelete(false)}
            >
              ยกเลิก
            </Button>
          </div>
        )}
        {confirmingCategoryDelete && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="min-w-0 flex-1 break-words font-semibold">ลบหมวดวิชานี้?</span>
            <Button
              type="button"
              variant="destructive"
              className={SMALL}
              disabled={busy}
              onClick={handleDeleteCategory}
            >
              ยืนยันลบหมวดวิชา
            </Button>
            <Button
              type="button"
              variant="outline"
              className={SMALL}
              onClick={() => setConfirmingCategoryDelete(false)}
            >
              ยกเลิก
            </Button>
          </div>
        )}
      </div>

      <div id={bodyId} hidden={!expanded}>
        <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {formOpen ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitRequirement)}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[12rem_12rem_auto]"
              >
                <FormField
                  control={form.control}
                  name="minCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หน่วยกิตขั้นต่ำ</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minCourses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนวิชาขั้นต่ำ (ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
                  <Button
                    type="submit"
                    variant="outline"
                    className={SMALL}
                    disabled={form.formState.isSubmitting}
                  >
                    {requirement ? 'บันทึกเกณฑ์' : 'ตั้งเกณฑ์หน่วยกิต'}
                  </Button>
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      className={SMALL}
                      onClick={() => setEditing(false)}
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          ) : null}
        </div>
        {children}
      </div>
    </Card>
  );
}
