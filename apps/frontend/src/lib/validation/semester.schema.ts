import { z } from 'zod';

export const semesterSchema = z.object({
  term: z.enum(['FIRST', 'SECOND', 'SUMMER'], {
    errorMap: () => ({ message: 'กรุณาเลือกภาคเรียน' }),
  }),
});

export type SemesterFormValues = z.infer<typeof semesterSchema>;
