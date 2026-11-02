import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  detectImageMimeFromBytes,
  detectVideoMimeFromBytes,
  UploadsService,
} from './uploads.service.js';

describe('UploadsService', () => {
  const service = new UploadsService();
  const coursesImageDir = join(process.cwd(), 'public', 'images', 'courses');
  const videosDir = join(process.cwd(), 'public', 'videos');

  it('detects JPEG, PNG and WEBP magic bytes accurately', () => {
    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const pngBytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const webpBytes = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'binary');
    const fakeBytes = Buffer.from('not-an-image-content', 'utf-8');

    expect(detectImageMimeFromBytes(jpegBytes)).toBe('image/jpeg');
    expect(detectImageMimeFromBytes(pngBytes)).toBe('image/png');
    expect(detectImageMimeFromBytes(webpBytes)).toBe('image/webp');
    expect(detectImageMimeFromBytes(fakeBytes)).toBeNull();
  });

  it('detects MP4 and WEBM video magic bytes accurately', () => {
    const mp4Bytes = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    ]);
    const webmBytes = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42]);
    const fakeBytes = Buffer.from('not-a-video-file', 'utf-8');

    expect(detectVideoMimeFromBytes(mp4Bytes)).toBe('video/mp4');
    expect(detectVideoMimeFromBytes(webmBytes)).toBe('video/webm');
    expect(detectVideoMimeFromBytes(fakeBytes)).toBeNull();
  });

  it('accepts a valid PNG image and returns its /public/images/courses URL, then deletes it safely', async () => {
    await mkdir(coursesImageDir, { recursive: true });
    const filename = `test-valid-${Date.now()}.png`;
    const filePath = join(coursesImageDir, filename);
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    await writeFile(filePath, pngHeader);

    const result = await service.finalizeUploadedImage(
      {
        filename,
        path: filePath,
        size: pngHeader.length,
        mimetype: 'image/png',
      } as Express.Multer.File,
      'courses',
    );

    expect(result).toEqual({
      url: `/public/images/courses/${filename}`,
      filename,
      size: pngHeader.length,
      mimeType: 'image/png',
    });
    expect(existsSync(filePath)).toBe(true);

    await service.deleteLocalFile(result.url);
    expect(existsSync(filePath)).toBe(false);
  });

  it('accepts a valid MP4 video in public/videos and deletes it safely', async () => {
    await mkdir(videosDir, { recursive: true });
    const filename = `test-video-${Date.now()}.mp4`;
    const filePath = join(videosDir, filename);
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
    ]);
    await writeFile(filePath, mp4Header);

    const result = await service.finalizeUploadedVideo({
      filename,
      path: filePath,
      size: mp4Header.length,
      mimetype: 'video/mp4',
    } as Express.Multer.File);

    expect(result).toEqual({
      url: `/public/videos/${filename}`,
      filename,
      size: mp4Header.length,
      mimeType: 'video/mp4',
    });
    expect(existsSync(filePath)).toBe(true);

    await service.deleteLocalFile(result.url);
    expect(existsSync(filePath)).toBe(false);
  });

  it('rejects and deletes a spoofed file whose magic bytes are not an image or video', async () => {
    await mkdir(coursesImageDir, { recursive: true });
    const filename = `test-spoofed-${Date.now()}.png`;
    const filePath = join(coursesImageDir, filename);
    const fakeContent = Buffer.from('<?php echo "hack"; ?>', 'utf-8');
    await writeFile(filePath, fakeContent);

    await expect(
      service.finalizeUploadedImage(
        {
          filename,
          path: filePath,
          size: fakeContent.length,
          mimetype: 'image/png',
        } as Express.Multer.File,
        'courses',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(existsSync(filePath)).toBe(false);

    const videoFilename = `test-spoofed-${Date.now()}.mp4`;
    const videoFilePath = join(videosDir, videoFilename);
    await writeFile(videoFilePath, fakeContent);

    await expect(
      service.finalizeUploadedVideo({
        filename: videoFilename,
        path: videoFilePath,
        size: fakeContent.length,
        mimetype: 'video/mp4',
      } as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);

    expect(existsSync(videoFilePath)).toBe(false);
  });

  it('ignores external URLs or path traversal attempts in deleteLocalFile', async () => {
    await expect(
      service.deleteLocalFile('https://example.com/course.png'),
    ).resolves.toBeUndefined();
    await expect(
      service.deleteLocalFile('/public/images/courses/../../package.json'),
    ).resolves.toBeUndefined();
    expect(existsSync(join(process.cwd(), 'package.json'))).toBe(true);
  });
});
