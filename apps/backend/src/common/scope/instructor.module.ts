import { Module } from '@nestjs/common';
import { InstructorGuard } from '../guards/instructor.guard';

// Leaf module — no imports, only depends on PrismaService (@Global()).
// Same shape/reasoning as ScopeModule.
@Module({
  providers: [InstructorGuard],
  exports: [InstructorGuard],
})
export class InstructorModule {}
