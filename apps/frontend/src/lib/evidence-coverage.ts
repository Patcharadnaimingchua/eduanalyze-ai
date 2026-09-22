import {
  fetchAssessmentCloMappings,
  fetchAssessmentDefinitions,
  fetchStudentAssessmentScores,
} from '@/lib/api/assessment-evidence';

// Counts how many students have a graded score behind each CLO of a course.
//
// Deliberately counting, not calculating: there is no course-level evidence
// endpoint, and deriving an achievement percentage here would mean porting
// calculate-actual-clo.ts (Decimal arithmetic plus the ABSENT/EXCLUDE policy
// rules) into the browser, where it would drift from the backend. Coverage is
// the honest thing the client can compute on its own — the percentage itself
// stays server-side, per attempt.
//
// Costs 1 + definitions + mappings requests, all reads, so they run in
// parallel and land in React Query's cache beside the evidence tab's own.
export async function fetchCourseEvidenceCoverage(
  courseId: string,
): Promise<Map<string, number>> {
  const definitions = await fetchAssessmentDefinitions(courseId);
  const mappingLists = await Promise.all(
    definitions
      .filter((definition) => definition.isActive)
      .map((definition) => fetchAssessmentCloMappings(definition.id, courseId)),
  );
  const mappings = mappingLists.flat().filter((mapping) => mapping.isActive);

  const scored = await Promise.all(
    mappings.map(async (mapping) => ({
      cloId: mapping.cloId,
      scores: await fetchStudentAssessmentScores(mapping.id, courseId),
    })),
  );

  // A student counts once per CLO however many assessments feed it, matching
  // the score-entry badge's "roster students with a graded score" meaning.
  const studentsByClo = new Map<string, Set<string>>();
  for (const { cloId, scores } of scored) {
    let students = studentsByClo.get(cloId);
    if (!students) {
      students = new Set<string>();
      studentsByClo.set(cloId, students);
    }
    for (const score of scores) {
      if (score.status === 'GRADED') students.add(score.studentCourseRecordId);
    }
  }

  return new Map([...studentsByClo].map(([cloId, students]) => [cloId, students.size]));
}
