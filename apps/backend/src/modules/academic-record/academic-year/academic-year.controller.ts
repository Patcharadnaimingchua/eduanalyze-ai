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
import { AcademicYearService } from './academic-year.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@ApiTags('academic-record')
@Controller('academic-years')
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active academic years' })
  @ApiResponse({ status: 200, description: 'List of active academic years' })
  findAll() {
    return this.academicYearService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get an academic year by id' })
  @ApiResponse({ status: 200, description: 'Academic year found' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  findOne(@Param('id') id: string) {
    return this.academicYearService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an academic year' })
  @ApiResponse({ status: 201, description: 'Academic year created' })
  @ApiResponse({ status: 409, description: 'Academic year already exists' })
  create(@Body() dto: CreateAcademicYearDto) {
    return this.academicYearService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an academic year' })
  @ApiResponse({ status: 200, description: 'Academic year updated' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  @ApiResponse({ status: 409, description: 'Academic year already exists' })
  update(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.academicYearService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete an academic year' })
  @ApiResponse({ status: 200, description: 'Academic year deactivated' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  @ApiResponse({
    status: 409,
    description: 'Academic year still has active semesters',
  })
  remove(@Param('id') id: string) {
    return this.academicYearService.remove(id);
  }
}
