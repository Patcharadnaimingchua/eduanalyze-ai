import { Module } from '@nestjs/common';
import { CourseModule } from '../course/course.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { PrerequisiteController } from './prerequisite.controller';
import { PrerequisiteService } from './prerequisite.service';

@Module({
  imports: [CourseModule, ScopeModule],
  controllers: [PrerequisiteController],
  providers: [PrerequisiteService],
  exports: [PrerequisiteService],
})
export class PrerequisiteModule {}
