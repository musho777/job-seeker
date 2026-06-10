import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JobsService } from './services/jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './job.entity';
import { StaffAmService } from './services/staff-am.service';
import { SchedulerService } from './services/scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [JobsService, StaffAmService, SchedulerService],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}
