import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JobsService } from './services/jobs.service';
import { Job } from './job.entity';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiResponse({ status: 200, description: 'Returns all jobs', type: [Job] })
  findAll(): Promise<Job[]> {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({ status: 200, description: 'Returns a single job', type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id') id: string): Promise<Job | null> {
    return this.jobsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiBody({ type: Job })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    type: Job,
  })
  create(@Body() jobData: Partial<Job>): Promise<Job> {
    return this.jobsService.create(jobData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a job' })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiBody({ type: Job })
  @ApiResponse({
    status: 200,
    description: 'Job updated successfully',
    type: Job,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  update(
    @Param('id') id: string,
    @Body() jobData: Partial<Job>,
  ): Promise<Job | null> {
    return this.jobsService.update(+id, jobData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job' })
  @ApiParam({ name: 'id', description: 'Job ID', type: Number })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.jobsService.remove(+id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Manually trigger job sync from staff.am' })
  @ApiResponse({
    status: 201,
    description: 'Job sync completed successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Job sync completed' },
        added: { type: 'number', example: 5 },
        skipped: { type: 'number', example: 10 },
      },
    },
  })
  async syncJobs(): Promise<{
    message: string;
    added: number;
    skipped: number;
  }> {
    const result = await this.jobsService.syncJobsFromStaffAm();
    return {
      message: 'Job sync completed',
      ...result,
    };
  }
}
