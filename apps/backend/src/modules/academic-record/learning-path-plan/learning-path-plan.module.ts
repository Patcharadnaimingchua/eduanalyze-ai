import { Module } from '@nestjs/common';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { LearningPathModule } from '../learning-path/learning-path.module';
import { LearningPathPlanController } from './learning-path-plan.controller';
import { LearningPathPlanService } from './learning-path-plan.service';

@Module({
  imports: [StudentProfileModule, LearningPathModule],
  controllers: [LearningPathPlanController],
  providers: [LearningPathPlanService],
})
export class LearningPathPlanModule {}
