import Link from "next/link";
import type { StaffOverviewProgram } from "@eduanalyze-ai/shared-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readAverageGpa } from "./student-reading";

// gradedByCurriculum: active students with a GPA, per curriculum — the base the
// backend's averageGpa is averaged over, which the report itself does not carry.
export function ProgramOverviewList({
  programs,
  gradedByCurriculum,
}: {
  programs: StaffOverviewProgram[];
  gradedByCurriculum: Map<string, number>;
}) {
  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">คุณยังไม่มีสาขาในความดูแล</p>
    );
  }

  return (
    <div className="space-y-4">
      {programs.some((p) =>
        p.curricula.some((c) => c.coursesWithoutClo > 0),
      ) && (
        <p className="text-sm text-muted-foreground">
          CLO ของรายวิชากำหนดโดยผู้ดูแลระบบ (ADMIN) — หากวิชาใดยังไม่มี CLO
          กรุณาแจ้งผู้ดูแลระบบให้เพิ่ม
        </p>
      )}
      {programs.map((program) => (
        <Card key={program.programId}>
          <CardHeader>
            <CardTitle>
              <span className="font-mono text-sm text-muted-foreground">
                {program.programCode}
              </span>{" "}
              {program.programName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {program.facultyName} · {program.departmentName}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {program.curricula.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ยังไม่มีหลักสูตรในสาขานี้
              </p>
            ) : (
              program.curricula.map((curriculum) => {
                const gpa = readAverageGpa(
                  curriculum.averageGpa,
                  gradedByCurriculum.get(curriculum.curriculumId) ?? 0,
                );
                return (
                  <div
                    key={curriculum.curriculumId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-primary">
                      ฉบับ {curriculum.version} (ปี {curriculum.effectiveYear})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">
                        {curriculum.studentCount} นักศึกษา
                      </Badge>
                      <Badge tone="neutral">GPA เฉลี่ย {gpa.text}</Badge>
                      <Link
                        href={`/staff/curriculum?curriculumId=${curriculum.curriculumId}`}
                        title="ดูรายวิชาของหลักสูตรนี้"
                        className="hover:opacity-80"
                      >
                        <Badge
                          tone={
                            curriculum.coursesWithoutClo > 0
                              ? "danger"
                              : "success"
                          }
                        >
                          {curriculum.coursesWithoutClo}/
                          {curriculum.totalCourses} วิชายังไม่มี CLO
                        </Badge>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
