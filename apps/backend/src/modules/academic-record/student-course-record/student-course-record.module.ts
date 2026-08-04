import { Module } from '@nestjs/common';
import { CourseModule } from '../../curriculum-content/course/course.module';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { SemesterModule } from '../semester/semester.module';
import { StudentCourseRecordController } from './student-course-record.controller';
import { StudentCourseRecordService } from './student-course-record.service';

@Module({
  imports: [StudentProfileModule, CourseModule, SemesterModule],
  controllers: [StudentCourseRecordController],
  providers: [StudentCourseRecordService],
  exports: [StudentCourseRecordService],
})
export class StudentCourseRecordModule {}
