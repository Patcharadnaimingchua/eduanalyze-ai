import { Module } from '@nestjs/common';
import { AcademicYearModule } from './academic-year/academic-year.module';
import { SemesterModule } from './semester/semester.module';
import { StudentCourseRecordModule } from './student-course-record/student-course-record.module';

@Module({
  imports: [AcademicYearModule, SemesterModule, StudentCourseRecordModule],
})
export class AcademicRecordModule {}
