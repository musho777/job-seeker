import { ApiProperty } from '@nestjs/swagger';

export class ApplyJobDto {
  @ApiProperty({
    description: 'Job announcement ID from staff.am',
    example: 158491,
  })
  job_announcement_id!: number;

  @ApiProperty({
    description: 'Company ID from staff.am',
    example: 1594,
  })
  companyId!: number;

  @ApiProperty({
    description: 'Job announcement title',
    example: 'Senior Software Engineer',
  })
  job_announcement_title!: string;

  @ApiProperty({
    description: 'First name of the applicant',
    example: 'Mush',
    required: false,
  })
  first_name?: string;

  @ApiProperty({
    description: 'Last name of the applicant',
    example: 'Poghosyan',
    required: false,
  })
  last_name?: string;

  @ApiProperty({
    description: 'Email of the applicant',
    example: 'mushopoghosyan7@gmail.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Phone number of the applicant',
    example: '+374 93 613007',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Cover letter',
    example: '',
    required: false,
  })
  cover_letter?: string;
}
