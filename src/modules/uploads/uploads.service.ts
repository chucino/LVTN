import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, readFile, unlink } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { diskStorage } from 'multer';
import {
  IMAGE_UPLOAD_FOLDERS,
  type ImageUploadFolder,
  UploadDocumentResponseDto,
  UploadResponseDto,
} from './dto/upload-response.dto.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB
export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
]);

const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md',
};

const LOCAL_PUBLIC_FILE_PATTERN =
  /^\/public\/(?:images\/(?:courses|avatars)|videos|files)\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|mp4|webm|pdf|docx|txt|md|zip)$/;

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

export function extractTextFromDocxBuffer(buffer: Buffer): string | null {
  try {
    // Tìm entry "word/document.xml" trong Central Directory hoặc Local File Header của file ZIP (.docx)
    let offset = 0;
    while (offset + 30 <= buffer.length) {
      // Local file header signature = 0x04034b50
      if (buffer.readUInt32LE(offset) !== 0x04034b50) {
        offset += 1;
        continue;
      }
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);
      const nameStart = offset + 30;
      const nameEnd = nameStart + fileNameLength;
      if (nameEnd > buffer.length) break;

      const entryName = buffer.subarray(nameStart, nameEnd).toString('utf8');
      const dataStart = nameEnd + extraFieldLength;

      if (entryName === 'word/document.xml') {
        let xmlBuffer: Buffer;
        if (compressionMethod === 0) {
          xmlBuffer = buffer.subarray(dataStart, dataStart + compressedSize);
        } else if (compressionMethod === 8) {
          // Nếu compressedSize === 0 (bit 3 data descriptor), giải nén phần còn lại
          const slice =
            compressedSize > 0
              ? buffer.subarray(dataStart, dataStart + compressedSize)
              : buffer.subarray(dataStart);
          xmlBuffer = inflateRawSync(slice);
        } else {
          return null;
        }

        const xml = xmlBuffer.toString('utf8');
        const paragraphs: string[] = [];
        const pMatches = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
        for (const pXml of pMatches) {
          const tMatches = pXml.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) ?? [];
          const line = tMatches
            .map((tTag) =>
              tTag
                .replace(/^<w:t(?:\s[^>]*)?>/, '')
                .replace(/<\/w:t>$/, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'"),
            )
            .join('');
          if (line.trim().length > 0) {
            paragraphs.push(line.trim());
          }
        }
        return paragraphs.join('\n\n').slice(0, 50000);
      }

      offset =
        compressedSize > 0 ? dataStart + compressedSize : dataStart + 1;
    }
    return null;
  } catch {
    return null;
  }
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

export function createDocumentMulterOptions(): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        const targetDir = join(process.cwd(), 'public', 'files');
        mkdirSync(targetDir, { recursive: true });
        callback(null, targetDir);
      },
      filename: (_req, file, callback) => {
        const rawExt = extname(file.originalname).toLowerCase();
        const ext = ALLOWED_DOCUMENT_EXTENSIONS.has(rawExt)
          ? rawExt
          : EXTENSION_BY_MIME[file.mimetype] || '.txt';
        const safeName = `${Date.now()}-${randomUUID()}${ext}`;
        callback(null, safeName);
      },
    }),
    limits: {
      fileSize: MAX_DOCUMENT_SIZE_BYTES,
      files: 1,
    },
    fileFilter: (_req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
        callback(
          new BadRequestException(
            'Chỉ chấp nhận file tài liệu định dạng PDF, DOCX, TXT hoặc MD',
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

  async finalizeUploadedDocument(
    file: Express.Multer.File | undefined,
  ): Promise<UploadDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file tài liệu để tải lên');
    }

    if (file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Dung lượng file tài liệu không hợp lệ (tối đa 25MB)',
      );
    }

    const ext = extname(file.filename).toLowerCase();
    if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
      await this.safeUnlink(file.path);
      throw new BadRequestException(
        'Định dạng file tài liệu không được hỗ trợ (chỉ nhận PDF, DOCX, TXT, MD)',
      );
    }

    let extractedText: string | null = null;
    let mimeType = file.mimetype || 'application/octet-stream';

    if (ext === '.pdf') {
      const header = await this.readHeaderBytes(file.path, 5);
      const isPdf =
        header &&
        header.length >= 5 &&
        header[0] === 0x25 && // %
        header[1] === 0x50 && // P
        header[2] === 0x44 && // D
        header[3] === 0x46 && // F
        header[4] === 0x2d; // -
      if (!isPdf) {
        await this.safeUnlink(file.path);
        throw new BadRequestException('Nội dung file không phải là tài liệu PDF hợp lệ');
      }
      mimeType = 'application/pdf';
    } else if (ext === '.docx') {
      const fileBuffer = await readFile(file.path);
      const isZip =
        fileBuffer.length >= 4 &&
        fileBuffer[0] === 0x50 &&
        fileBuffer[1] === 0x4b &&
        fileBuffer[2] === 0x03 &&
        fileBuffer[3] === 0x04;
      if (!isZip) {
        await this.safeUnlink(file.path);
        throw new BadRequestException('Nội dung file không phải là tài liệu Word (.docx) hợp lệ');
      }
      extractedText = extractTextFromDocxBuffer(fileBuffer);
      mimeType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.txt' || ext === '.md') {
      const fileBuffer = await readFile(file.path);
      if (fileBuffer.includes(0x00)) {
        await this.safeUnlink(file.path);
        throw new BadRequestException('File văn bản (.txt/.md) chứa dữ liệu nhị phân không hợp lệ');
      }
      extractedText = fileBuffer.toString('utf8').replace(/\r\n/g, '\n').trim().slice(0, 50000);
      mimeType = ext === '.md' ? 'text/markdown' : 'text/plain';
    }

    let decodedOriginalName = file.originalname;
    try {
      const candidate = Buffer.from(file.originalname, 'latin1').toString('utf8');
      if (!candidate.includes('\ufffd')) {
        decodedOriginalName = candidate;
      }
    } catch {
      // Giữ nguyên originalname
    }

    return {
      url: `/public/files/${file.filename}`,
      filename: file.filename,
      originalName: decodedOriginalName.slice(0, 255),
      size: file.size,
      mimeType,
      extractedText,
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
