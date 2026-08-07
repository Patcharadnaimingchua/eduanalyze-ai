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
import { PrerequisiteService } from './prerequisite.service';
import { CreatePrerequisiteDto } from './dto/create-prerequisite.dto';
import { UpdatePrerequisiteDto } from './dto/update-prerequisite.dto';

@ApiTags('curriculum-content')
@Controller('prerequisites')
export class PrerequisiteController {
  constructor(private readonly prerequisiteService: PrerequisiteService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List prerequisites' })
  @ApiResponse({ status: 200, description: 'List of prerequisites' })
  findAll() {
    return this.prerequisiteService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a prerequisite by id' })
  @ApiResponse({ status: 200, description: 'Prerequisite found' })
  @ApiResponse({ status: 404, description: 'Prerequisite not found' })
  findOne(@Param('id') id: string) {
    return this.prerequisiteService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('course', { from: 'body', key: 'courseId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a prerequisite' })
  @ApiResponse({ status: 201, description: 'Prerequisite created' })
  @ApiResponse({ status: 400, description: 'Invalid or cross-curriculum course pair' })
  @ApiResponse({ status: 403, description: 'No scope covering this course' })
  @ApiResponse({ status: 404, description: 'Course not found or inactive' })
  @ApiResponse({ status: 409, description: 'Prerequisite already exists' })
  create(@Body() dto: CreatePrerequisiteDto) {
    return this.prerequisiteService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('prerequisite', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a prerequisite (groupId only)' })
  @ApiResponse({ status: 200, description: 'Prerequisite updated' })
  @ApiResponse({ status: 403, description: 'No scope covering this prerequisite' })
  @ApiResponse({ status: 404, description: 'Prerequisite not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePrerequisiteDto) {
    return this.prerequisiteService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('prerequisite', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a prerequisite' })
  @ApiResponse({ status: 200, description: 'Prerequisite deleted' })
  @ApiResponse({ status: 403, description: 'No scope covering this prerequisite' })
  @ApiResponse({ status: 404, description: 'Prerequisite not found' })
  remove(@Param('id') id: string) {
    return this.prerequisiteService.remove(id);
  }
}
