import { Module } from '@nestjs/common';
import { StudentCourseRecordModule } from '../student-course-record/student-course-record.module';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { CreditCheckerController } from './credit-checker.controller';
import { CreditCheckerService } from './credit-checker.service';

@Module({
  imports: [StudentProfileModule, StudentCourseRecordModule],
  controllers: [CreditCheckerController],
  providers: [CreditCheckerService],
})
export class CreditCheckerModule {}
