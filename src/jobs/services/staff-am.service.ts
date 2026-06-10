import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface StaffAmJob {
  id: number;
  itemType: number;
  title: {
    ru: string;
    en: string;
    am: string;
  };
  companiesStruct: {
    id: number;
    title: {
      ru: string;
      en: string;
      am: string;
    };
    profile_image?: string;
  };
  deadline: string;
  slug: {
    ru: string;
    en: string;
    am: string;
  };
  is_remote: boolean;
  is_hot: boolean;
  is_featured: boolean;
  category?: {
    title: {
      ru: string;
      en: string;
      am: string;
    };
  };
}

interface StaffAmApiResponse {
  pageProps?: {
    jobs?: StaffAmJob[];
  };
}

@Injectable()
export class StaffAmService {
  private readonly logger = new Logger(StaffAmService.name);
  private readonly apiUrl =
    'https://staff.am/_next/data/GMuQfOihMpfurjOmCbct1/ru/jobs.json';

  private readonly keywords = [
    'react',
    'js',
    'javascript',
    'react native',
    'nest js',
    'node js',
    'backend',
    'frontend',
    'mobile developer',
  ];

  constructor(private readonly httpService: HttpService) {}

  async fetchReactJobs(): Promise<StaffAmJob[]> {
    try {
      this.logger.log('Fetching jobs from staff.am API for all keywords...');

      const allJobs = new Map<number, StaffAmJob>(); // Use Map to avoid duplicates by job ID

      for (const keyword of this.keywords) {
        this.logger.log(`Fetching jobs for keyword: "${keyword}"...`);

        try {
          const response = await firstValueFrom(
            this.httpService.get<StaffAmApiResponse>(this.apiUrl, {
              params: {
                key_word: keyword,
                sort_by: 2,
              },
            }),
          );

          const jobs: StaffAmJob[] = response.data?.pageProps?.jobs || [];

          // Filter out banner items (itemType: 0)
          const validJobs: StaffAmJob[] = jobs.filter(
            (job) => job.itemType === 1,
          );

          // Add jobs to map (automatically prevents duplicates)
          validJobs.forEach((job) => {
            if (!allJobs.has(job.id)) {
              allJobs.set(job.id, job);
            }
          });

          this.logger.log(
            `Fetched ${validJobs.length} jobs for keyword "${keyword}"`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to fetch jobs for keyword "${keyword}"`,
            error,
          );
          // Continue with next keyword even if one fails
        }
      }

      const uniqueJobs = Array.from(allJobs.values());
      this.logger.log(
        `Total unique jobs fetched: ${uniqueJobs.length} from ${this.keywords.length} keywords`,
      );

      return uniqueJobs;
    } catch (error) {
      this.logger.error('Failed to fetch jobs from staff.am', error);
      throw error;
    }
  }
}
