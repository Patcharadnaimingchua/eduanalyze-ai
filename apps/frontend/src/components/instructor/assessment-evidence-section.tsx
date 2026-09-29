'use client';

import { useState } from 'react';
import { UNSAVED_SCORES_CONFIRM_MESSAGE } from '@/lib/score-form-guard';
import type { CloAchievementEntry } from '@eduanalyze-ai/shared-types';
import { AssessmentDefinitionPanel } from './assessment-definition-panel';
import { AssessmentCloMappingPanel } from './assessment-clo-mapping-panel';
import { StudentScoreEntryPanel } from './student-score-entry-panel';

// Orchestrates the 3-level drill-down (Assessment -> CLO mapping -> Score
// entry) behind the instructor dashboard's "evidence" tab. Selection state
// is local UI state, not URL-driven — unlike the top-level course/tab
// selection in instructor/courses/[courseId]/page.tsx, this is a transient
// in-page drill-down that doesn't need to survive a reload or be
// link-shareable.
//
// Feeds the new assessment-evidence infrastructure only — never reads or
// writes CourseAssessmentCloScore (the 1-5 self-assessment) or the
// grade-based CloAchievementService/PloAchievementService.
export function AssessmentEvidenceSection({
  courseId,
  clos,
}: {
  courseId: string;
  clos: CloAchievementEntry[];
}) {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);

  const [hasUnsavedScores, setHasUnsavedScores] = useState(false);

  // Unsaved score edits live only in the score panel's form; leaving it for
  // another assessment/CLO discards them, so ask first.
  function confirmDiscardUnsaved(): boolean {
    return !hasUnsavedScores || window.confirm(UNSAVED_SCORES_CONFIRM_MESSAGE);
  }

  function selectDefinition(definitionId: string) {
    if (definitionId === selectedDefinitionId) return;
    if (!confirmDiscardUnsaved()) return;
    setSelectedDefinitionId(definitionId);
    setSelectedMappingId(null);
    setHasUnsavedScores(false);
  }

  function selectMapping(mappingId: string) {
    if (mappingId === selectedMappingId) return;
    if (!confirmDiscardUnsaved()) return;
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
          clos={clos}
          assessmentDefinitionId={selectedDefinitionId}
          selectedMappingId={selectedMappingId}
          onSelect={(mappingId) => selectMapping(mappingId)}
        />
      )}

      {selectedDefinitionId && selectedMappingId && (
        <StudentScoreEntryPanel
          courseId={courseId}
          assessmentDefinitionId={selectedDefinitionId}
          assessmentCloMappingId={selectedMappingId}
          onDirtyChange={setHasUnsavedScores}
        />
      )}
    </div>
  );
}
