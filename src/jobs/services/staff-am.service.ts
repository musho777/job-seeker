import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');
import * as fs from 'fs';
import * as path from 'path';
import { ApplyJobDto } from '../dto/apply-job.dto';

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

  async applyToJob(applicationData: ApplyJobDto): Promise<unknown> {
    try {
      this.logger.log(
        `Applying to job: ${applicationData.job_announcement_title} (ID: ${applicationData.job_announcement_id})`,
      );

      // Default applicant data
      const defaultData = {
        first_name: 'Mush',
        last_name: 'Poghosyan',
        email: 'mushopoghosyan7@gmail.com',
        phone: '+374 93 613007',
      };

      // Merge with provided data (provided data takes precedence)
      const applicantData = {
        first_name: applicationData.first_name || defaultData.first_name,
        last_name: applicationData.last_name || defaultData.last_name,
        email: applicationData.email || defaultData.email,
        phone: applicationData.phone || defaultData.phone,
        cover_letter: applicationData.cover_letter || '',
      };

      // Path to CV file
      const cvPath = path.join(
        __dirname,
        '..',
        '..',
        'assets',
        'Mush_Poghosyan.pdf',
      );

      // Check if CV file exists
      if (!fs.existsSync(cvPath)) {
        throw new Error(`CV file not found at: ${cvPath}`);
      }

      // Create form data
      const form = new FormData();
      form.append('first_name', applicantData.first_name);
      form.append('last_name', applicantData.last_name);
      form.append('email', applicantData.email);
      form.append('phone', applicantData.phone);
      form.append('cover_letter', applicantData.cover_letter);
      form.append('hidden_companies', '');
      form.append('companyId', applicationData.companyId.toString());
      form.append(
        'job_announcement_id',
        applicationData.job_announcement_id.toString(),
      );
      form.append(
        'job_announcement_title',
        applicationData.job_announcement_title,
      );
      form.append('selectedOption', 'null');
      form.append('file_id', '0');
      form.append('apply_type', 'WITH_CV');

      // Read CV file and append it twice (as per the original request)
      const cvBuffer = fs.readFileSync(cvPath);
      form.append('cv', cvBuffer, {
        filename: 'Mush_Poghosyan.pdf',
        contentType: 'application/pdf',
      });
      form.append('ApplyAsGuestForm[cv]', cvBuffer, {
        filename: 'Mush_Poghosyan.pdf',
        contentType: 'application/pdf',
      });

      // Submit application
      const applyUrl =
        'https://api.staff.am/ru/v4/applicant/apply?Content-Type=multipart%2Fform-data';

      const response = await firstValueFrom(
        this.httpService.post(applyUrl, form, {
          headers: {
            ...form.getHeaders(),
            accept: 'application/json, text/plain, */*',
            'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,hy;q=0.6',
            apptype: 'web',
            guestauth: 'web-guest',
            origin: 'https://staff.am',
            referer: 'https://staff.am/',
            systemname: 'web',
          },
        }),
      );

      this.logger.log(
        `Successfully applied to job: ${applicationData.job_announcement_title}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to apply to job', error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        this.logger.error('Response status:', status);
        this.logger.error('Response data:', JSON.stringify(data));

        // Create a user-friendly error message
        let errorMessage = 'Failed to submit application';
        let errorDetails = data;

        if (status === 422) {
          // Validation error
          if (Array.isArray(data)) {
            errorMessage = data.map(err => err.message).join(', ');
          } else {
            errorMessage = 'Invalid application data';
          }
        } else if (status === 403) {
          // Forbidden - already applied or access denied
          if (data.message) {
            errorMessage = data.message === 'Кандидат уже откликался на данную вакансию'
              ? 'You have already applied to this job'
              : data.message;
          } else {
            errorMessage = 'Access denied or already applied';
          }
        } else if (status === 404) {
          errorMessage = 'Job not found or no longer available';
        } else if (status >= 500) {
          errorMessage = 'Server error, please try again later';
        }

        // Throw a structured error
        const structuredError = new Error(errorMessage) as Error & {
          statusCode: number;
          response: unknown;
        };
        structuredError.statusCode = status;
        structuredError.response = errorDetails;
        throw structuredError;
      }

      throw error;
    }
  }
}
