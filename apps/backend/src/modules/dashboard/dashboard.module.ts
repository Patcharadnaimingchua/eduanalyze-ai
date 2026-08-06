import { Module } from '@nestjs/common';
import { CreditCheckerModule } from '../academic-record/credit-checker/credit-checker.module';
import { LearningPathModule } from '../academic-record/learning-path/learning-path.module';
import { StudentCourseRecordModule } from '../academic-record/student-course-record/student-course-record.module';
import { CloAchievementModule } from '../curriculum-content/clo-achievement/clo-achievement.module';
import { CourseAssessmentModule } from '../curriculum-content/course-assessment/course-assessment.module';
import { CourseModule } from '../curriculum-content/course/course.module';
import { PloAchievementModule } from '../curriculum-content/plo-achievement/plo-achievement.module';
import { ScopeModule } from '../../common/scope/scope.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    CreditCheckerModule,
    StudentCourseRecordModule,
    PloAchievementModule,
    LearningPathModule,
    CourseModule,
    CloAchievementModule,
    CourseAssessmentModule,
    ScopeModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
