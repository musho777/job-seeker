import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
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
import { StaffAmService } from './services/staff-am.service';
import { ApplyJobDto } from './dto/apply-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly staffAmService: StaffAmService,
  ) {}

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

  @Post('apply')
  @ApiOperation({
    summary: 'Apply to a job on staff.am',
    description:
      'Automatically applies to a job using the provided details. If applicant data is not provided, default values will be used.',
  })
  @ApiBody({ type: ApplyJobDto })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Application submitted successfully',
        },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid application data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Already applied to this job',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'You have already applied to this job' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found or no longer available',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity - Invalid job data',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 422 },
        message: { type: 'string', example: 'Invalid Job' },
        error: { type: 'string', example: 'Unprocessable Entity' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to submit application',
  })
  async applyToJob(
    @Body() applicationData: ApplyJobDto,
  ): Promise<{ message: string; data: any }> {
    try {
      const result = await this.staffAmService.applyToJob(applicationData);
      return {
        message: 'Application submitted successfully',
        data: result,
      };
    } catch (error) {
      // Handle structured errors from the service
      if (error.statusCode) {
        throw new HttpException(
          {
            statusCode: error.statusCode,
            message: error.message,
            error: this.getErrorName(error.statusCode),
            details: error.response,
          },
          error.statusCode,
        );
      }

      // Handle unexpected errors
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred while submitting the application',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
    };
    return errorNames[statusCode] || 'Error';
  }
}
