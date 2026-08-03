# EduAnalyzeAI

ระบบติดตามความก้าวหน้าทางการศึกษาและวิเคราะห์ผลลัพธ์การเรียนรู้ตามหลักสูตร (Course → CLO → PLO)

## Tech Stack

**Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL, bcrypt, JWT, class-validator, @nestjs/throttler, Helmet

**Frontend:** Next.js, React, TypeScript

## Monorepo Structure

```
apps/
  backend/     # NestJS API — source of truth for all business logic, security, and data
  frontend/    # Next.js client
packages/
  shared-types/  # Types shared between backend and frontend (added when needed)
```

## Development Principles

- Backend is the security boundary. Frontend never enforces authorization on its own.
- Every significant API validates Authentication + Role + Scope — not Role alone.
- Analytics (GPA, CLO/PLO achievement, Radar values) are deterministic calculations done in the backend. AI only interprets already-computed results; it never generates scores.
- Development proceeds one phase at a time, per the project's phased roadmap. Each phase is reviewed and approved before implementation.

## Getting Started

Setup instructions will be added as each phase is implemented (starting with database connection and Prisma schema in Phase 1).
