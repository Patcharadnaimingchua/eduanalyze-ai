'use client';

import { useState } from 'react';
import { AssessmentDefinitionPanel } from './assessment-definition-panel';
import { AssessmentCloMappingPanel } from './assessment-clo-mapping-panel';
import { StudentScoreEntryPanel } from './student-score-entry-panel';

// Orchestrates the 3-level drill-down (Assessment -> CLO mapping -> Score
// entry) behind the instructor dashboard's "evidence" tab. Selection state
// is local UI state, not URL-driven — unlike the top-level course/tab
// selection in instructor/dashboard/page.tsx, this is a transient
// in-page drill-down that doesn't need to survive a reload or be
// link-shareable.
//
// Feeds the new assessment-evidence infrastructure only — never reads or
// writes CourseAssessmentCloScore (the 1-5 self-assessment) or the
// grade-based CloAchievementService/PloAchievementService.
export function AssessmentEvidenceSection({ courseId }: { courseId: string }) {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);

  function selectDefinition(definitionId: string) {
    setSelectedDefinitionId(definitionId);
    setSelectedMappingId(null);
  }

  function selectMapping(mappingId: string) {
    setSelectedMappingId(mappingId);
  }

  return (
    <div className="space-y-4">
      <AssessmentDefinitionPanel
        courseId={courseId}
        selectedDefinitionId={selectedDefinitionId}
        onSelect={selectDefinition}
      />

      {selectedDefinitionId && (
        <AssessmentCloMappingPanel
          courseId={courseId}
          assessmentDefinitionId={selectedDefinitionId}
          selectedMappingId={selectedMappingId}
          onSelect={(mappingId) => selectMapping(mappingId)}
        />
      )}

      {selectedMappingId && (
        <StudentScoreEntryPanel courseId={courseId} assessmentCloMappingId={selectedMappingId} />
      )}
    </div>
  );
}
