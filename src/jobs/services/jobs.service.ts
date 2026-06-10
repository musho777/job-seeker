import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../job.entity';
import { StaffAmService } from './staff-am.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    private staffAmService: StaffAmService,
  ) {}

  async findAll(): Promise<Job[]> {
    return this.jobsRepository.find();
  }

  async findOne(id: number): Promise<Job | null> {
    return this.jobsRepository.findOne({ where: { id } });
  }

  async findBySourceId(sourceId: string): Promise<Job | null> {
    return this.jobsRepository.findOne({ where: { sourceId } });
  }

  async create(jobData: Partial<Job>): Promise<Job> {
    const job = this.jobsRepository.create(jobData);
    return this.jobsRepository.save(job);
  }

  async update(id: number, jobData: Partial<Job>): Promise<Job | null> {
    await this.jobsRepository.update(id, jobData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.jobsRepository.delete(id);
  }

  async syncJobsFromStaffAm(): Promise<{ added: number; skipped: number }> {
    this.logger.log('Starting job sync from staff.am...');

    const staffAmJobs = await this.staffAmService.fetchReactJobs();
    let added = 0;
    let skipped = 0;

    for (const staffAmJob of staffAmJobs) {
      const sourceId = staffAmJob.id.toString();

      // Check if job already exists
      const existingJob = await this.findBySourceId(sourceId);

      if (existingJob) {
        this.logger.debug(`Job ${sourceId} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create new job
      try {
        await this.create({
          source: 'staff.am',
          sourceId: sourceId,
          company:
            staffAmJob.companiesStruct?.title?.en ||
            staffAmJob.companiesStruct?.title?.ru ||
            'Unknown',
          title: staffAmJob.title?.en || staffAmJob.title?.ru || 'No Title',
          description: `Deadline: ${staffAmJob.deadline || 'N/A'}`,
          isApplying: false,
        });

        this.logger.log(`Added new job: ${sourceId} - ${staffAmJob.title?.en}`);
        added++;
      } catch (error) {
        this.logger.error(`Failed to add job ${sourceId}`, error);
      }
    }

    this.logger.log(`Job sync completed. Added: ${added}, Skipped: ${skipped}`);

    return { added, skipped };
  }
}
