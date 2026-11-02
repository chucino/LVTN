import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { diskStorage } from 'multer';
import {
  IMAGE_UPLOAD_FOLDERS,
  type ImageUploadFolder,
  UploadResponseDto,
} from './dto/upload-response.dto.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const LOCAL_PUBLIC_FILE_PATTERN =
  /^\/public\/(?:images\/(?:courses|avatars)|videos|files)\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|mp4|webm|pdf|zip|txt)$/;

export function detectImageMimeFromBytes(
  buffer: Uint8Array,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'image/webp';
  }
  return null;
}

export function detectVideoMimeFromBytes(
  buffer: Uint8Array,
): 'video/mp4' | 'video/webm' | null {
  // MP4 ISO Base Media header: bytes 4..7 === 'ftyp' (0x66 0x74 0x79 0x70)
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return 'video/mp4';
  }
  // WebM / Matroska EBML header: bytes 0..3 === 0x1A 0x45 0xDF 0xA3
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }
  return null;
}

export function resolveImageFolder(rawFolder: unknown): ImageUploadFolder {
  if (
    typeof rawFolder === 'string' &&
    (IMAGE_UPLOAD_FOLDERS as readonly string[]).includes(rawFolder)
  ) {
    return rawFolder as ImageUploadFolder;
  }
  return 'courses';
}

export function createImageMulterOptions(): MulterOptions {
  return {
    storage: diskStorage({
      destination: (req, _file, callback) => {
        const folder = resolveImageFolder(req.query?.folder);
        const targetDir = join(process.cwd(), 'public', 'images', folder);
        mkdirSync(targetDir, { recursive: true });
        callback(null, targetDir);
      },
      filename: (_req, file, callback) => {
        const ext =
          EXTENSION_BY_MIME[file.mimetype] ||
          extname(file.originalname).toLowerCase() ||
          '.jpg';
        const safeName = `${Date.now()}-${randomUUID()}${ext}`;
        callback(null, safeName);
      },
    }),
    limits: {
      fileSize: MAX_IMAGE_SIZE_BYTES,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
        callback(
          new BadRequestException(
            'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP',
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
  };
}

export function createVideoMulterOptions(): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        const targetDir = join(process.cwd(), 'public', 'videos');
        mkdirSync(targetDir, { recursive: true });
        callback(null, targetDir);
      },
      filename: (_req, file, callback) => {
        const ext =
          EXTENSION_BY_MIME[file.mimetype] ||
          extname(file.originalname).toLowerCase() ||
          '.mp4';
        const safeName = `${Date.now()}-${randomUUID()}${ext}`;
        callback(null, safeName);
      },
    }),
    limits: {
      fileSize: MAX_VIDEO_SIZE_BYTES,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_VIDEO_MIMES.has(file.mimetype)) {
        callback(
          new BadRequestException(
            'Chỉ chấp nhận file video định dạng MP4 hoặc WEBM',
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
  };
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly publicRoot = resolve(process.cwd(), 'public');

  constructor() {
    mkdirSync(join(this.publicRoot, 'images', 'courses'), { recursive: true });
    mkdirSync(join(this.publicRoot, 'images', 'avatars'), { recursive: true });
    mkdirSync(join(this.publicRoot, 'videos'), { recursive: true });
    mkdirSync(join(this.publicRoot, 'files'), { recursive: true });
  }

  async finalizeUploadedImage(
    file: Express.Multer.File | undefined,
    folder: ImageUploadFolder = 'courses',
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Dung lượng ảnh không hợp lệ (tối đa 5MB)',
      );
    }

    const detectedMime = await this.readAndDetectImageMime(file.path);
    if (!detectedMime || !ALLOWED_IMAGE_MIMES.has(detectedMime)) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Nội dung file không phải là định dạng ảnh hợp lệ (JPG, PNG, WEBP)',
      );
    }

    const safeFolder = resolveImageFolder(folder);
    return {
      url: `/public/images/${safeFolder}/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimeType: detectedMime,
    };
  }

  async finalizeUploadedVideo(
    file: Express.Multer.File | undefined,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file video để tải lên');
    }

    if (file.size <= 0 || file.size > MAX_VIDEO_SIZE_BYTES) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Dung lượng video không hợp lệ (tối đa 1GB)',
      );
    }

    const detectedMime = await this.readAndDetectVideoMime(file.path);
    if (!detectedMime || !ALLOWED_VIDEO_MIMES.has(detectedMime)) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Nội dung file không phải là định dạng video hợp lệ (MP4, WEBM)',
      );
    }

    return {
      url: `/public/videos/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimeType: detectedMime,
    };
  }

  async deleteLocalFile(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl || !LOCAL_PUBLIC_FILE_PATTERN.test(publicUrl)) {
      return;
    }

    const relativePath = publicUrl.replace(/^\/public\//, '');
    const absolutePath = resolve(this.publicRoot, relativePath);
    if (!absolutePath.startsWith(`${this.publicRoot}${sep}`)) {
      return;
    }

    await this.safeUnlink(absolutePath);
  }

  async discardTempFile(filePath: string): Promise<void> {
    await this.safeUnlink(filePath);
  }

  private async readAndDetectImageMime(
    filePath: string,
  ): Promise<'image/jpeg' | 'image/png' | 'image/webp' | null> {
    const header = await this.readHeaderBytes(filePath, 12);
    return header ? detectImageMimeFromBytes(header) : null;
  }

  private async readAndDetectVideoMime(
    filePath: string,
  ): Promise<'video/mp4' | 'video/webm' | null> {
    const header = await this.readHeaderBytes(filePath, 12);
    return header ? detectVideoMimeFromBytes(header) : null;
  }

  private async readHeaderBytes(
    filePath: string,
    length: number,
  ): Promise<Uint8Array | null> {
    let handle: Awaited<ReturnType<typeof open>> | null = null;
    try {
      handle = await open(filePath, 'r');
      const header = Buffer.alloc(length);
      const { bytesRead } = await handle.read(header, 0, length, 0);
      return header.subarray(0, bytesRead);
    } catch {
      return null;
    } finally {
      await handle?.close().catch(() => undefined);
    }
  }

  private async safeUnlink(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Không thể xóa file cũ tại ${filePath}`);
      }
    }
  }
}
