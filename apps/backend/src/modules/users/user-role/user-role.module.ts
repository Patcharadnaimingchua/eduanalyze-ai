import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserRoleService } from './user-role.service';

@Module({
  imports: [UserModule],
  providers: [UserRoleService],
  exports: [UserRoleService],
})
export class UserRoleModule {}
