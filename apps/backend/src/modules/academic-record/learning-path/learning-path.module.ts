import { Module } from '@nestjs/common';
import { CreditCheckerModule } from '../credit-checker/credit-checker.module';
import { StudentCourseRecordModule } from '../student-course-record/student-course-record.module';
import { LearningPathController } from './learning-path.controller';
import { LearningPathService } from './learning-path.service';

@Module({
  imports: [CreditCheckerModule, StudentCourseRecordModule],
  controllers: [LearningPathController],
  providers: [LearningPathService],
})
export class LearningPathModule {}
