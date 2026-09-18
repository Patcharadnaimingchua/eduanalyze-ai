'use client';

import { ClipboardList, Lightbulb, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import {
  NO_COURSES_SUMMARY,
  NO_STUDENTS_SUMMARY,
  interpretInstructorCourses,
} from '@/lib/interpret-instructor-courses';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function IconList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  tone: 'strength' | 'weakness' | 'neutral';
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-primary">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon
              size={15}
              className={cn(
                'mt-0.5 shrink-0',
                tone === 'strength' && 'text-emerald-600',
                tone === 'weakness' && 'text-amber-600',
                tone === 'neutral' && 'text-primary',
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Deliberately not labelled "AI": the text is rule-based and derived from
// the numbers already on this page (interpret-instructor-courses.ts), the
// same honesty applied to PloInterpretationCard on the aptitude page.
export function CourseInsightCard({ courses }: { courses: InstructorCourseSummary[] }) {
  const insight = interpretInstructorCourses(courses);
  const hasNoData =
    insight.summary === NO_COURSES_SUMMARY || insight.summary === NO_STUDENTS_SUMMARY;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList size={16} className="text-brand" />
          สรุปภาพรวมรายวิชาที่คุณสอน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoData ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Sparkles size={28} className="text-slate-300" />
            <p className="text-muted-foreground">{insight.summary}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>
            <IconList title="จุดแข็ง" items={insight.strengths} icon={TrendingUp} tone="strength" />
            <IconList
              title="จุดที่ควรดูแล"
              items={insight.weaknesses}
              icon={TrendingDown}
              tone="weakness"
            />
            <IconList
              title="ข้อเสนอแนะ"
              items={insight.recommendations}
              icon={Lightbulb}
              tone="neutral"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
