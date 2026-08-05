import { Module } from '@nestjs/common';
import { StudentCourseRecordModule } from '../../academic-record/student-course-record/student-course-record.module';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { CloAchievementModule } from '../clo-achievement/clo-achievement.module';
import { PloAchievementController } from './plo-achievement.controller';
import { PloAchievementService } from './plo-achievement.service';

@Module({
  imports: [
    StudentProfileModule,
    StudentCourseRecordModule,
    CloAchievementModule,
    CurriculumModule,
  ],
  controllers: [PloAchievementController],
  providers: [PloAchievementService],
})
export class PloAchievementModule {}
