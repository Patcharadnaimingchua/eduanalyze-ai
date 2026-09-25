'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { fetchCourseCloAchievement, fetchCourseRoster } from '@/lib/api/instructor';
import { fetchCourseEvidenceCoverage } from '@/lib/evidence-coverage';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CourseResultsSection } from './course-results-section';
import { CloAchievementSection } from './clo-achievement-section';
import { StudentRosterTable } from './student-roster-table';
import { AssessmentEvidenceSection } from './assessment-evidence-section';
import { CourseInfoSection } from './course-info-section';

export type InstructorTab = 'grades' | 'clo' | 'roster' | 'evidence' | 'course';

// Split by the question each one answers: raw grades (day-to-day teaching)
// vs threshold attainment (curriculum QA). 'grades' absorbed the old
// standalone 'trend' tab, so stale ?tab=trend links fall back onto the tab
// that now contains the trend chart.
const TABS: { key: InstructorTab; label: string }[] = [
  { key: 'grades', label: 'ผลการเรียน' },
  { key: 'clo', label: 'ผลลัพธ์การเรียนรู้' },
  { key: 'roster', label: 'Gradebook' },
  { key: 'evidence', label: 'Assessment Evidence' },
  { key: 'course', label: 'ข้อมูลรายวิชา' },
];

export function parseInstructorTab(value: string | null): InstructorTab {
  return TABS.find((tab) => tab.key === value)?.key ?? 'grades';
}

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
  const queryClient = useQueryClient();

  const cloQuery = useQuery({
    queryKey: ['course-clo-achievement', course.courseId],
    queryFn: () => fetchCourseCloAchievement(course.courseId),
    enabled: isInstructor && activeTab === 'clo',
  });

  const rosterQuery = useQuery({
    queryKey: ['course-roster', course.courseId],
    queryFn: () => fetchCourseRoster(course.courseId),
    enabled: isInstructor && (activeTab === 'roster' || activeTab === 'clo'),
  });

  // Evidence coverage sits beside the grade-based numbers on the CLO tab so
  // the two are never confused for one another.
  const evidenceCoverageQuery = useQuery({
    queryKey: ['course-evidence-coverage', course.courseId],
    queryFn: () => fetchCourseEvidenceCoverage(course.courseId),
    enabled: isInstructor && activeTab === 'clo',
  });

  function handleGradebookChanged() {
    void queryClient.invalidateQueries({ queryKey: ['course-roster', course.courseId] });
    void queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
          <p className="text-lg font-medium text-primary">{course.name}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-100">
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
          <CourseResultsSection
            distribution={course.gradeDistribution}
            trend={course.semesterTrend}
          />
        )}

        {activeTab === 'clo' && (
          <CloAchievementSection
            achievementPercent={course.achievementPercent}
            achievementThreshold={course.achievementThreshold}
            clos={course.clos}
            plos={course.plos}
            courseAssessment={course.courseAssessment}
            detail={cloQuery.data}
            isLoading={cloQuery.isLoading}
            isError={cloQuery.isError}
            evidenceCoverage={evidenceCoverageQuery.data}
            evidenceTotal={rosterQuery.data?.length}
            evidenceError={evidenceCoverageQuery.isError}
            roster={rosterQuery.data}
            onViewRoster={() => onTabChange('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <StudentRosterTable
            courseId={course.courseId}
            courseCode={course.code}
            clos={course.clos}
            roster={rosterQuery.data}
            isLoading={rosterQuery.isLoading}
            isError={rosterQuery.isError}
            onChanged={isInstructor ? handleGradebookChanged : undefined}
          />
        )}

        {/* Own internal queries (not the enabled-per-tab pattern above) —
            mounting only while this tab is active already keeps it from
            firing requests when unused, same net effect. */}
        {activeTab === 'evidence' && isInstructor && (
          <AssessmentEvidenceSection courseId={course.courseId} clos={course.clos} />
        )}

        {activeTab === 'course' && <CourseInfoSection course={course} />}
      </CardContent>
    </Card>
  );
}
