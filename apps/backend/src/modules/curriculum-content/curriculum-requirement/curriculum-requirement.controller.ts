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
import { CurriculumRequirementService } from './curriculum-requirement.service';
import { CreateCurriculumRequirementDto } from './dto/create-curriculum-requirement.dto';
import { UpdateCurriculumRequirementDto } from './dto/update-curriculum-requirement.dto';

@ApiTags('curriculum-content')
@Controller('curriculum-requirements')
export class CurriculumRequirementController {
  constructor(
    private readonly curriculumRequirementService: CurriculumRequirementService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List curriculum requirements' })
  @ApiResponse({ status: 200, description: 'List of curriculum requirements' })
  findAll() {
    return this.curriculumRequirementService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a curriculum requirement by id' })
  @ApiResponse({ status: 200, description: 'Curriculum requirement found' })
  @ApiResponse({ status: 404, description: 'Curriculum requirement not found' })
  findOne(@Param('id') id: string) {
    return this.curriculumRequirementService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('curriculum', { from: 'body', key: 'curriculumId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a curriculum requirement' })
  @ApiResponse({ status: 201, description: 'Curriculum requirement created' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum' })
  @ApiResponse({
    status: 404,
    description: 'Curriculum or course category not found or inactive',
  })
  @ApiResponse({
    status: 409,
    description: 'Course category already has a curriculum requirement',
  })
  create(@Body() dto: CreateCurriculumRequirementDto) {
    return this.curriculumRequirementService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('curriculumRequirement', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a curriculum requirement' })
  @ApiResponse({ status: 200, description: 'Curriculum requirement updated' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum requirement' })
  @ApiResponse({ status: 404, description: 'Curriculum requirement not found' })
  @ApiResponse({
    status: 409,
    description: 'Course category already has a curriculum requirement',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCurriculumRequirementDto,
  ) {
    return this.curriculumRequirementService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ScopeTarget('curriculumRequirement', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a curriculum requirement' })
  @ApiResponse({ status: 200, description: 'Curriculum requirement deleted' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum requirement' })
  @ApiResponse({ status: 404, description: 'Curriculum requirement not found' })
  remove(@Param('id') id: string) {
    return this.curriculumRequirementService.remove(id);
  }
}
