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
import { Roles } from '../../../common/decorators/roles.decorator';
import { ScopeTarget } from '../../../common/decorators/scope-target.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ScopeGuard } from '../../../common/guards/scope.guard';
import { CourseCategoryService } from './course-category.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';

@ApiTags('curriculum-content')
@Controller('course-categories')
export class CourseCategoryController {
  constructor(private readonly courseCategoryService: CourseCategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active course categories' })
  @ApiResponse({ status: 200, description: 'List of active course categories' })
  findAll() {
    return this.courseCategoryService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a course category by id' })
  @ApiResponse({ status: 200, description: 'Course category found' })
  @ApiResponse({ status: 404, description: 'Course category not found' })
  findOne(@Param('id') id: string) {
    return this.courseCategoryService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('curriculum', { from: 'body', key: 'curriculumId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a course category' })
  @ApiResponse({ status: 201, description: 'Course category created' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum' })
  @ApiResponse({ status: 404, description: 'Curriculum not found or inactive' })
  @ApiResponse({
    status: 409,
    description: 'Course category name already in use within this curriculum',
  })
  create(@Body() dto: CreateCourseCategoryDto) {
    return this.courseCategoryService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('courseCategory', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a course category' })
  @ApiResponse({ status: 200, description: 'Course category updated' })
  @ApiResponse({ status: 403, description: 'No scope covering this course category' })
  @ApiResponse({ status: 404, description: 'Course category not found' })
  @ApiResponse({
    status: 409,
    description: 'Course category name already in use within this curriculum',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCourseCategoryDto) {
    return this.courseCategoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('courseCategory', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a course category' })
  @ApiResponse({ status: 200, description: 'Course category deactivated' })
  @ApiResponse({ status: 403, description: 'No scope covering this course category' })
  @ApiResponse({ status: 404, description: 'Course category not found' })
  @ApiResponse({
    status: 409,
    description: 'Course category still has active courses',
  })
  remove(@Param('id') id: string) {
    return this.courseCategoryService.remove(id);
  }
}
