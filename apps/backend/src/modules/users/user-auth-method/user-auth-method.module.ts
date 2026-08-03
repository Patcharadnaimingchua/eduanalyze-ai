import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserAuthMethodService } from './user-auth-method.service';

@Module({
  imports: [UserModule],
  providers: [UserAuthMethodService],
  exports: [UserAuthMethodService],
})
export class UserAuthMethodModule {}
