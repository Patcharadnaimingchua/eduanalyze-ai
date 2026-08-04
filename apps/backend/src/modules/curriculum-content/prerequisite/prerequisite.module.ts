import { Module } from '@nestjs/common';
import { CourseModule } from '../course/course.module';
import { PrerequisiteController } from './prerequisite.controller';
import { PrerequisiteService } from './prerequisite.service';

@Module({
  imports: [CourseModule],
  controllers: [PrerequisiteController],
  providers: [PrerequisiteService],
  exports: [PrerequisiteService],
})
export class PrerequisiteModule {}
