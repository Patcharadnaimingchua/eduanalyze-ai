import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CurriculumSeed {
  version: string;
  effectiveYear: number;
  totalCredits: number;
}

interface ProgramSeed {
  name: string;
  code: string;
  curricula: CurriculumSeed[];
}

interface DepartmentSeed {
  name: string;
  code: string;
  programs: ProgramSeed[];
}

// PROJECT_CONTEXT.md §6 — Example Organization Data.
// effectiveYear/version are Buddhist Era (พ.ศ.) years, as written in the
// source document — not converted to Gregorian.
//
// totalCredits: only ICT 2564 (126) and ICT 2569 (120) are real published
// figures. Every other curriculum below uses 132 as a placeholder pending
// real documentation from each program — do not treat those as
// authoritative numbers.
const FACULTY = { name: 'คณะศิลปศาสตร์และวิทยาศาสตร์', code: 'LASCI' };

const DEPARTMENTS: DepartmentSeed[] = [
  {
    name: 'ภาควิชาบริหารธุรกิจและการบัญชี',
    code: 'BA-ACC',
    programs: [
      {
        name: 'การตลาด',
        code: 'MKT',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
      {
        name: 'การบัญชี',
        code: 'ACC',
        curricula: [{ version: '2564', effectiveYear: 2564, totalCredits: 132 }], // placeholder
      },
      {
        name: 'การจัดการ',
        code: 'MGT',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
    ],
  },
  {
    name: 'ภาควิชาสังคมศาสตร์',
    code: 'SOC',
    programs: [
      {
        name: 'การเมืองและการปกครอง',
        code: 'POLSCI',
        curricula: [{ version: '2567', effectiveYear: 2567, totalCredits: 132 }], // placeholder
      },
    ],
  },
  {
    name: 'ภาควิชาวิทยาการคำนวณและเทคโนโลยีดิจิทัล',
    code: 'CDT',
    programs: [
      {
        name: 'เทคโนโลยีสารสนเทศและการสื่อสาร',
        code: 'ICT',
        curricula: [
          { version: '2559', effectiveYear: 2559, totalCredits: 132 }, // placeholder — real figure not documented yet
          { version: '2564', effectiveYear: 2564, totalCredits: 126 }, // real
          { version: '2569', effectiveYear: 2569, totalCredits: 120 }, // real
        ],
      },
      {
        name: 'คณิตศาสตร์ประยุกต์',
        code: 'MATH',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
      {
        name: 'วิทยาการคอมพิวเตอร์',
        code: 'CS',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
    ],
  },
  {
    name: 'ภาควิชาวิทยาศาสตร์และนวัตกรรมชีวภาพ',
    code: 'BIO',
    programs: [
      {
        name: 'พฤกษนวัตกรรม',
        code: 'PLANT',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
      {
        name: 'จุลชีววิทยา',
        code: 'MICRO',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
      {
        name: 'วิทยาศาสตร์ชีวภาพ',
        code: 'BIOSCI',
        curricula: [{ version: '2566', effectiveYear: 2566, totalCredits: 132 }], // placeholder
      },
    ],
  },
  {
    name: 'ภาควิชาวิทยาการภาษาและวัฒนธรรม',
    code: 'LANG',
    programs: [
      {
        name: 'ภาษาอังกฤษ',
        code: 'ENG',
        curricula: [
          { version: '2563', effectiveYear: 2563, totalCredits: 132 }, // placeholder
          { version: '2568', effectiveYear: 2568, totalCredits: 132 }, // placeholder
        ],
      },
    ],
  },
  {
    name: 'ภาควิชาวิทยาศาสตร์กายภาพและวัสดุศาสตร์',
    code: 'PHYS',
    programs: [
      {
        name: 'ฟิสิกส์',
        code: 'PHYSICS',
        curricula: [{ version: '2566', effectiveYear: 2566, totalCredits: 132 }], // placeholder
      },
      {
        name: 'เคมี',
        code: 'CHEM',
        curricula: [{ version: '2565', effectiveYear: 2565, totalCredits: 132 }], // placeholder
      },
    ],
  },
];

async function main() {
  const faculty = await prisma.faculty.upsert({
    where: { code: FACULTY.code },
    update: { name: FACULTY.name },
    create: FACULTY,
  });
  console.log(`Faculty: ${faculty.name} (${faculty.code})`);

  for (const deptSeed of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { facultyId_code: { facultyId: faculty.id, code: deptSeed.code } },
      update: { name: deptSeed.name },
      create: { name: deptSeed.name, code: deptSeed.code, facultyId: faculty.id },
    });
    console.log(`  Department: ${department.name} (${department.code})`);

    for (const progSeed of deptSeed.programs) {
      const program = await prisma.program.upsert({
        where: {
          departmentId_code: { departmentId: department.id, code: progSeed.code },
        },
        update: { name: progSeed.name },
        create: {
          name: progSeed.name,
          code: progSeed.code,
          departmentId: department.id,
        },
      });
      console.log(`    Program: ${program.name} (${program.code})`);

      for (const curSeed of progSeed.curricula) {
        const curriculum = await prisma.curriculum.upsert({
          where: {
            programId_version: { programId: program.id, version: curSeed.version },
          },
          update: {
            effectiveYear: curSeed.effectiveYear,
            totalCredits: curSeed.totalCredits,
          },
          create: {
            programId: program.id,
            version: curSeed.version,
            effectiveYear: curSeed.effectiveYear,
            totalCredits: curSeed.totalCredits,
          },
        });
        console.log(
          `      Curriculum: ${curriculum.version} (totalCredits=${curriculum.totalCredits})`,
        );
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
