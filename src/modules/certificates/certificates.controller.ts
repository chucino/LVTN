import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CertificatesService } from './certificates.service.js';
import {
  CertificateResponseDto,
  CertificateVerifyResponseDto,
} from './dto/certificate-response.dto.js';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Danh sách chứng chỉ đã được cấp của học viên' })
  @ApiResponse({ status: 200, type: [CertificateResponseDto] })
  getMyCertificates(
    @CurrentUser() user: CurrentUserData,
  ): Promise<CertificateResponseDto[]> {
    return this.certificatesService.getMyCertificates(user.userId);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({
    summary: 'Tra cứu và xác thực tính hợp lệ của chứng chỉ công khai',
  })
  @ApiParam({
    name: 'code',
    example: 'NC-2026-8F4K9X2M',
    description: 'Mã số chứng chỉ',
  })
  @ApiResponse({ status: 200, type: CertificateVerifyResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chứng chỉ' })
  verifyCertificate(
    @Param('code') code: string,
  ): Promise<CertificateVerifyResponseDto> {
    return this.certificatesService.verifyByCode(code);
  }
}

