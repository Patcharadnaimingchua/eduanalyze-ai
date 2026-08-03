import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { UserRoleModule } from './user-role/user-role.module';
import { UserScopeModule } from './user-scope/user-scope.module';
import { UserAuthMethodModule } from './user-auth-method/user-auth-method.module';
import { StudentProfileModule } from './student-profile/student-profile.module';

@Module({
  imports: [
    UserModule,
    UserRoleModule,
    UserScopeModule,
    UserAuthMethodModule,
    StudentProfileModule,
  ],
  exports: [
    UserModule,
    UserRoleModule,
    UserScopeModule,
    UserAuthMethodModule,
    StudentProfileModule,
  ],
})
export class UsersModule {}
