import { Module } from '@nestjs/common';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { CourseModule } from '../course/course.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { CourseAssessmentController } from './course-assessment.controller';
import { CourseAssessmentService } from './course-assessment.service';

@Module({
  imports: [StudentProfileModule, CourseModule, ScopeModule],
  controllers: [CourseAssessmentController],
  providers: [CourseAssessmentService],
  exports: [CourseAssessmentService],
})
export class CourseAssessmentModule {}
