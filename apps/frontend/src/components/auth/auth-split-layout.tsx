import { GraduationCap } from 'lucide-react';

// Shared shell for /login and /register — a wider two-panel layout
// (brand panel + form), distinct from the (auth) route group's narrow
// single-card layout used by verify-otp/forgot-password/reset-password.
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 shadow-sm md:grid-cols-2">
        <div className="hidden flex-col justify-center bg-brand-light p-10 md:flex">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <GraduationCap size={18} className="text-brand-light" />
            </div>
            <span className="text-base font-medium text-primary">EduAnalyzeAI</span>
          </div>

          <h1 className="mb-3 text-2xl font-medium leading-snug text-primary">
            ยินดีต้อนรับสู่พื้นที่เรียนรู้ที่ใช่สำหรับคุณ
          </h1>

          <p className="mb-8 max-w-xs text-sm leading-relaxed text-brand">
            เข้าถึงระบบติดตามผลการเรียนที่ครอบคลุม การวิเคราะห์ CLO/PLO
            และการวิเคราะห์ศักยภาพความถนัด เพื่อขับเคลื่อนความสำเร็จของนิสิต/นักศึกษา
          </p>

          <div className="flex gap-2">
            <span className="h-1 w-6 rounded-full bg-brand" />
            <span className="h-1 w-2 rounded-full bg-brand/40" />
            <span className="h-1 w-2 rounded-full bg-brand/40" />
          </div>
        </div>

        <div className="flex flex-col justify-center p-10">{children}</div>
      </div>
    </div>
  );
}
