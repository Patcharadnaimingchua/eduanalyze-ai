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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SemesterService } from './semester.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@ApiTags('academic-record')
@Controller('semesters')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active semesters' })
  @ApiResponse({ status: 200, description: 'List of active semesters' })
  findAll() {
    return this.semesterService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a semester by id' })
  @ApiResponse({ status: 200, description: 'Semester found' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  findOne(@Param('id') id: string) {
    return this.semesterService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a semester' })
  @ApiResponse({ status: 201, description: 'Semester created' })
  @ApiResponse({ status: 404, description: 'Academic year not found or inactive' })
  @ApiResponse({
    status: 409,
    description: 'Semester term already in use within this academic year',
  })
  create(@Body() dto: CreateSemesterDto) {
    return this.semesterService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a semester' })
  @ApiResponse({ status: 200, description: 'Semester updated' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  @ApiResponse({
    status: 409,
    description: 'Semester term already in use within this academic year',
  })
  update(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.semesterService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a semester' })
  @ApiResponse({ status: 200, description: 'Semester deactivated' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  @ApiResponse({
    status: 409,
    description: 'Semester still has student course records',
  })
  remove(@Param('id') id: string) {
    return this.semesterService.remove(id);
  }
}
