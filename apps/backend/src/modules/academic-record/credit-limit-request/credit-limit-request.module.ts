import { Module } from '@nestjs/common';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { CreditLimitRequestController } from './credit-limit-request.controller';
import { CreditLimitRequestService } from './credit-limit-request.service';

@Module({
  imports: [StudentProfileModule],
  controllers: [CreditLimitRequestController],
  providers: [CreditLimitRequestService],
  exports: [CreditLimitRequestService],
})
export class CreditLimitRequestModule {}
