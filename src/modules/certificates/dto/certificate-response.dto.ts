import { ApiProperty } from '@nestjs/swagger';
import { CertificateStatus } from '../../../common/constants/learning.enum.js';

export class CertificateResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe901' })
  id!: string;

  @ApiProperty({ example: 'NC-2026-8F4K9X2M' })
  certificateCode!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  courseId!: string;

  @ApiProperty({ example: 'HTML và CSS cơ bản' })
  courseTitle!: string;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  instructorName!: string;

  @ApiProperty({ example: 'Trần Văn Học Viên' })
  studentName!: string;

  @ApiProperty({ example: '2026-11-02T08:30:00.000Z' })
  issuedAt!: string;

  @ApiProperty({ example: '/certificates/verify/NC-2026-8F4K9X2M' })
  qrCode!: string;

  @ApiProperty({ example: null, nullable: true })
  fileUrl!: string | null;

  @ApiProperty({ enum: CertificateStatus, example: CertificateStatus.VALID })
  status!: CertificateStatus;
}

export class CertificateVerifyResponseDto {
  @ApiProperty({ example: 'NC-2026-8F4K9X2M' })
  certificateCode!: string;

  @ApiProperty({ enum: CertificateStatus, example: CertificateStatus.VALID })
  status!: CertificateStatus;

  @ApiProperty({ example: true })
  isValid!: boolean;

  @ApiProperty({ example: '2026-11-02T08:30:00.000Z' })
  issuedAt!: string;

  @ApiProperty({ example: 'Trần Văn Học Viên' })
  studentName!: string;

  @ApiProperty({ example: 'HTML và CSS cơ bản' })
  courseTitle!: string;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  instructorName!: string;
}

