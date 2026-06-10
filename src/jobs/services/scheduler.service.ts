import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobsService } from './jobs.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly jobsService: JobsService) {}

  // Runs every day at 12:00 PM
  @Cron('0 12 * * *', {
    name: 'sync-staff-am-jobs',
    timeZone: 'Asia/Yerevan', // Adjust timezone as needed
  })
  async handleDailyJobSync() {
    this.logger.log('Starting scheduled job sync at 12:00...');

    try {
      const result = await this.jobsService.syncJobsFromStaffAm();
      this.logger.log(
        `Scheduled job sync completed. Added: ${result.added}, Skipped: ${result.skipped}`,
      );
    } catch (error) {
      this.logger.error('Scheduled job sync failed', error);
    }
  }

  // Optional: Manual trigger for testing
  async triggerManualSync() {
    this.logger.log('Manual job sync triggered...');
    return await this.jobsService.syncJobsFromStaffAm();
  }
}
