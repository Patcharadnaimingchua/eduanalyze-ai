import { Module } from '@nestjs/common';
import { StudentCourseRecordModule } from '../../academic-record/student-course-record/student-course-record.module';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { CourseModule } from '../course/course.module';
import { CloAchievementController } from './clo-achievement.controller';
import { CloAchievementService } from './clo-achievement.service';

@Module({
  imports: [CourseModule, CurriculumModule, StudentCourseRecordModule],
  controllers: [CloAchievementController],
  providers: [CloAchievementService],
})
export class CloAchievementModule {}
