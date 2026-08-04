import { Module } from '@nestjs/common';
import { CourseModule } from '../course/course.module';
import { CloController } from './clo.controller';
import { CloService } from './clo.service';

@Module({
  imports: [CourseModule],
  controllers: [CloController],
  providers: [CloService],
  exports: [CloService],
})
export class CloModule {}
