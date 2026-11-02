import {
  Controller,
  ForbiddenException,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  UploadImageQueryDto,
  UploadResponseDto,
} from './dto/upload-response.dto.js';
import {
  createImageMulterOptions,
  createVideoMulterOptions,
  UploadsService,
} from './uploads.service.js';

@ApiTags('Uploads')
@ApiBearerAuth('bearer')
@ApiExtraModels(UploadResponseDto)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', createImageMulterOptions()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Tải ảnh lên server (lưu vào public/images/courses hoặc avatars)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh JPG, PNG hoặc WEBP (tối đa 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        data: { $ref: getSchemaPath(UploadResponseDto) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'File không hợp lệ hoặc vượt quá giới hạn 5MB',
  })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền tải ảnh' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: UploadImageQueryDto,
    @CurrentUser() actor: CurrentUserData,
  ): Promise<UploadResponseDto> {
    const folder = query.folder ?? 'courses';
    if (
      folder !== 'avatars' &&
      actor.role !== Role.INSTRUCTOR &&
      actor.role !== Role.ADMIN
    ) {
      if (file?.path) {
        await this.uploadsService.discardTempFile(file.path);
      }
      throw new ForbiddenException(
        'Chỉ giảng viên hoặc quản trị viên mới có quyền tải ảnh khóa học',
      );
    }
    return this.uploadsService.finalizeUploadedImage(file, folder);
  }

  @Post('videos')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', createVideoMulterOptions()))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Tải video bài giảng lên server (lưu vào public/videos)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File video MP4 hoặc WEBM (tối đa 1GB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        data: { $ref: getSchemaPath(UploadResponseDto) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'File video không hợp lệ hoặc vượt quá giới hạn 1GB',
  })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền tải video' })
  uploadVideo(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadResponseDto> {
    return this.uploadsService.finalizeUploadedVideo(file);
  }
}
