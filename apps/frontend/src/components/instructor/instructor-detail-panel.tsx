'use client';

import { useQuery } from '@tanstack/react-query';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { fetchCourseCloAchievement, fetchCourseRoster } from '@/lib/api/instructor';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { GradeDistributionChart } from './grade-distribution-chart';
import { CloAchievementSection } from './clo-achievement-section';
import { StudentRosterTable } from './student-roster-table';

export type InstructorTab = 'grades' | 'clo' | 'roster';

const TABS: { key: InstructorTab; label: string }[] = [
  { key: 'grades', label: 'Grade Distribution' },
  { key: 'clo', label: 'CLO Achievement' },
  { key: 'roster', label: 'Student Roster' },
];

// Both queries here are lazy — enabled only once their tab is actually
// opened — so switching between courses without ever visiting the CLO or
// Roster tab never fires more than the one dashboard-level request.
export function InstructorDetailPanel({
  course,
  activeTab,
  onTabChange,
  isInstructor,
}: {
  course: InstructorCourseSummary;
  activeTab: InstructorTab;
  onTabChange: (tab: InstructorTab) => void;
  isInstructor: boolean;
}) {
  const cloQuery = useQuery({
    queryKey: ['course-clo-achievement', course.courseId],
    queryFn: () => fetchCourseCloAchievement(course.courseId),
    enabled: isInstructor && activeTab === 'clo',
  });

  const rosterQuery = useQuery({
    queryKey: ['course-roster', course.courseId],
    queryFn: () => fetchCourseRoster(course.courseId),
    enabled: isInstructor && activeTab === 'roster',
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
          <p className="text-lg font-medium text-primary">{course.name}</p>
        </div>

        <div className="flex gap-2 border-b border-slate-100">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition',
                activeTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'grades' && (
          <GradeDistributionChart distribution={course.gradeDistribution} />
        )}

        {activeTab === 'clo' && (
          <CloAchievementSection
            achievementPercent={course.achievementPercent}
            clos={course.clos}
            plos={course.plos}
            courseAssessment={course.courseAssessment}
            detail={cloQuery.data}
            isLoading={cloQuery.isLoading}
            isError={cloQuery.isError}
          />
        )}

        {activeTab === 'roster' && (
          <StudentRosterTable
            roster={rosterQuery.data}
            isLoading={rosterQuery.isLoading}
            isError={rosterQuery.isError}
          />
        )}
      </CardContent>
    </Card>
  );
}
