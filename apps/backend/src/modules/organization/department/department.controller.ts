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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiTags('organization')
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // Public — see FacultyController's findAll for the reasoning.
  @Get()
  @ApiOperation({ summary: 'List active departments' })
  @ApiResponse({ status: 200, description: 'List of active departments' })
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by id' })
  @ApiResponse({ status: 200, description: 'Department found' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('faculty', { from: 'body', key: 'facultyId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  @ApiResponse({ status: 403, description: 'No scope covering this faculty' })
  @ApiResponse({ status: 404, description: 'Faculty not found or inactive' })
  @ApiResponse({
    status: 409,
    description: 'Department code already in use within this faculty',
  })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('department', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  @ApiResponse({ status: 403, description: 'No scope covering this department' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({
    status: 409,
    description: 'Department code already in use within this faculty',
  })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('department', { from: 'param', key: 'id' })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a department' })
  @ApiResponse({ status: 200, description: 'Department deactivated' })
  @ApiResponse({ status: 403, description: 'No scope covering this department' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({
    status: 409,
    description: 'Department still has active programs',
  })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
