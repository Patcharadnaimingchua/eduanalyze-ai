import { Body, Controller, Delete, Get, HttpCode, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { SaveLearningPathPlanDto } from './dto/save-learning-path-plan.dto';
import { LearningPathPlanService } from './learning-path-plan.service';

@ApiTags('academic-record')
@Controller('learning-path-plan')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@ApiBearerAuth('access-token')
export class LearningPathPlanController {
  constructor(private readonly learningPathPlanService: LearningPathPlanService) {}

  @Get('me')
  @ApiOperation({ summary: "Current student's saved next-semester plan, or null if none saved" })
  @ApiResponse({ status: 200, description: '{ courseIds } in plan order, or null' })
  getMyPlan(@CurrentUser() user: RequestUser) {
    return this.learningPathPlanService.getMyPlan(user);
  }

  @Put('me')
  @ApiOperation({ summary: "Replace the current student's saved next-semester plan" })
  @ApiResponse({ status: 200, description: 'Plan saved' })
  @ApiResponse({ status: 400, description: 'A course is already passed or has unmet prerequisites' })
  saveMyPlan(@CurrentUser() user: RequestUser, @Body() dto: SaveLearningPathPlanDto) {
    return this.learningPathPlanService.saveMyPlan(user, dto);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiOperation({ summary: "Discard the current student's saved plan (back to the recommendation)" })
  @ApiResponse({ status: 204, description: 'Plan removed (or already absent)' })
  deleteMyPlan(@CurrentUser() user: RequestUser) {
    return this.learningPathPlanService.deleteMyPlan(user);
  }
}
