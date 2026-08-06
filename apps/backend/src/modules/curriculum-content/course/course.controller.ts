import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ScopeTarget } from '../../../common/decorators/scope-target.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ScopeGuard } from '../../../common/guards/scope.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('curriculum-content')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active courses' })
  @ApiResponse({ status: 200, description: 'List of active courses' })
  findAll() {
    return this.courseService.findAll();
  }

  // Declared before ':id' — otherwise NestJS would match 'my-courses' as
  // an :id param value.
  @Get('my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List courses the current INSTRUCTOR is assigned to' })
  @ApiResponse({ status: 200, description: 'List of assigned courses' })
  findMyCourses(@CurrentUser() user: RequestUser) {
    return this.courseService.findMyCourses(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a course by id' })
  @ApiResponse({ status: 200, description: 'Course found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('curriculum', { from: 'body', key: 'curriculumId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum' })
  @ApiResponse({
    status: 404,
    description: 'Curriculum or course category not found or inactive',
  })
  @ApiResponse({
    status: 409,
    description: 'Course code already in use within this curriculum',
  })
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('course', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  @ApiResponse({ status: 403, description: 'No scope covering this course' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 409,
    description: 'Course code already in use within this curriculum',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('course', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a course' })
  @ApiResponse({ status: 200, description: 'Course deactivated' })
  @ApiResponse({ status: 403, description: 'No scope covering this course' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 409,
    description: 'Course is still required as a prerequisite by another course',
  })
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
