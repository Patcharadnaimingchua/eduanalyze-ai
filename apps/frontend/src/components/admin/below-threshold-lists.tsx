'use client';

import { AlertTriangle } from 'lucide-react';
import type {
  ProblematicCloEntry,
  ProblematicPloEntry,
} from '@eduanalyze-ai/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CLO_DISPLAY_LIMIT = 15;

// Both lists show the evidence, not just a verdict. The PLO rollup is
// coarser than it looks — every CLO inherits its course's single
// achievement percent — so "3/6 CLO" is really "3 of the 6 courses behind
// this PLO", and the caption says so rather than letting the badge imply
// per-CLO measurement the data cannot support.
export function BelowThresholdLists({
  plos,
  clos,
}: {
  plos: ProblematicPloEntry[];
  clos: ProblematicCloEntry[];
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            PLO ที่ต่ำกว่าเกณฑ์
            {plos.length > 0 && <Badge tone="danger">{plos.length}</Badge>}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            นับว่ามีปัญหาเมื่อ CLO ที่ผูกกับ PLO นั้นไม่ผ่านเกณฑ์ตั้งแต่ครึ่งหนึ่งขึ้นไป
            — CLO ทุกตัวในวิชาเดียวกันใช้ผลสัมฤทธิ์ของวิชานั้นร่วมกัน ตัวเลขจึงสะท้อน
            &quot;จำนวนวิชาที่ยังไม่ผ่าน&quot; วิชาที่ยังไม่มีผู้เรียนไม่ถูกนับ
          </p>
        </CardHeader>
        <CardContent>
          {plos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มี PLO ที่ต่ำกว่าเกณฑ์
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {plos.map((plo) => (
                <li
                  key={plo.ploId}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-primary">{plo.code}</span>{' '}
                    <span className="text-muted-foreground">{plo.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {plo.programCode}/{plo.curriculumVersion}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {plo.averageValue !== null && (
                      <span className="text-xs text-muted-foreground">
                        เฉลี่ย {Math.round(plo.averageValue)}%
                      </span>
                    )}
                    <Badge tone="danger">
                      {plo.closBelowThreshold}/{plo.totalMeasuredClos} CLO ไม่ผ่าน
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            CLO ที่ต่ำกว่าเกณฑ์
            {clos.length > 0 && <Badge tone="danger">{clos.length}</Badge>}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            % นักศึกษาที่ได้เกรด B ขึ้นไปในวิชานั้น ต่ำกว่าเกณฑ์ของ CLO
            เรียงจากต่ำสุด
          </p>
        </CardHeader>
        <CardContent>
          {clos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มี CLO ที่ต่ำกว่าเกณฑ์
            </p>
          ) : (
            <div className="space-y-2">
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                {clos.slice(0, CLO_DISPLAY_LIMIT).map((clo) => (
                  <li
                    key={clo.cloId}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="text-muted-foreground">{clo.courseCode}</span>{' '}
                      <span className="font-medium text-primary">{clo.code}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {clo.programCode}/{clo.curriculumVersion}
                      </span>
                    </span>
                    <Badge tone="danger">
                      {Math.round(clo.achievementPercent)}% &lt; {clo.threshold}%
                    </Badge>
                  </li>
                ))}
              </ul>
              {clos.length > CLO_DISPLAY_LIMIT && (
                <p className="text-xs text-muted-foreground">
                  แสดง {CLO_DISPLAY_LIMIT} จาก {clos.length} รายการ
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
