import { Module } from '@nestjs/common';
import { AcademicYearModule } from './academic-year/academic-year.module';
import { CreditCheckerModule } from './credit-checker/credit-checker.module';
import { LearningPathModule } from './learning-path/learning-path.module';
import { SemesterModule } from './semester/semester.module';
import { StudentCourseRecordModule } from './student-course-record/student-course-record.module';

@Module({
  imports: [
    AcademicYearModule,
    SemesterModule,
    StudentCourseRecordModule,
    CreditCheckerModule,
    LearningPathModule,
  ],
})
export class AcademicRecordModule {}
