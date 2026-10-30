import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model, PipelineStage, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseQueryDto, CourseSort } from './dto/course-query.dto.js';
import { FeaturedQueryDto } from './dto/featured-query.dto.js';
import { CoursesService } from './courses.service.js';
import { Category } from './schemas/category.schema.js';
import { Course } from './schemas/course.schema.js';
import {
  CourseStatus,
  CourseType,
} from '../../common/constants/course.enum.js';
import { CourseDetailAggregateRecord } from './serializers/course.serializer.js';

describe('CoursesService', () => {
  let service: CoursesService;
  let aggregate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    aggregate = vi.fn();
    service = new CoursesService(
      { aggregate } as unknown as Model<Course>,
      {} as Model<Category>,
    );
  });

  it('filters approved courses and applies effective-price sort and database pagination', async () => {
    const exec = vi
      .fn()
      .mockResolvedValue([{ items: [], totalCount: [{ total: 26 }] }]);
    aggregate.mockReturnValue({ exec });
    const query = plainToInstance(CourseQueryDto, {
      keyword: 'JavaScript',
      type: CourseType.PRO,
      categoryId: '6650c1f6f2f4f6e4c8bfe124',
      level: 'Có cơ bản',
      minPrice: '300000',
      maxPrice: '600000',
      minRating: '4.2',
      sort: CourseSort.PRICE_ASC,
      page: '3',
      limit: '10',
    });

    const result = await service.getCourses(query);
    const pipeline = aggregate.mock.calls[0][0] as PipelineStage[];

    expect(pipeline[0]).toMatchObject({
      $match: {
        status: CourseStatus.APPROVED,
        type: CourseType.PRO,
        level: 'Có cơ bản',
        avgRating: { $gte: 4.2 },
      },
    });
    expect(JSON.stringify(pipeline[0])).toContain('JavaScript');
    expect(JSON.stringify(pipeline[0])).toContain('categoryId');
    expect(pipeline[1]).toMatchObject({
      $addFields: { effectivePrice: { $ifNull: ['$discountPrice', '$price'] } },
    });

    const facet = pipeline.find(
      (stage): stage is PipelineStage.Facet => '$facet' in stage,
    );
    expect(facet).toBeDefined();
    expect(facet?.$facet.items).toEqual(
      expect.arrayContaining([
        { $sort: { effectivePrice: 1, createdAt: -1, _id: -1 } },
        { $skip: 20 },
        { $limit: 10 },
      ]),
    );
    expect(result).toEqual({
      items: [],
      total: 26,
      page: 3,
      limit: 10,
      totalPages: 3,
    });
  });

  it('rejects an inverted price range', async () => {
    const query = plainToInstance(CourseQueryDto, {
      minPrice: 500000,
      maxPrice: 100000,
    });

    await expect(service.getCourses(query)).rejects.toThrow(
      BadRequestException,
    );
    expect(aggregate).not.toHaveBeenCalled();
  });

  it('orders featured courses by rating and recency and limits results', async () => {
    const exec = vi.fn().mockResolvedValue([]);
    aggregate.mockReturnValue({ exec });

    await service.getFeaturedCourses(
      plainToInstance(FeaturedQueryDto, { limit: '6' }),
    );

    const pipeline = aggregate.mock.calls[0][0] as PipelineStage[];
    expect(pipeline.slice(0, 3)).toEqual([
      { $match: { status: CourseStatus.APPROVED } },
      { $sort: { avgRating: -1, createdAt: -1, _id: -1 } },
      { $limit: 6 },
    ]);
    expect(pipeline.length).toBeGreaterThan(3);
  });

  it('validates page limits and rejects a featured limit above twelve', async () => {
    const invalidListQuery = plainToInstance(CourseQueryDto, { limit: '51' });
    const invalidFeaturedQuery = plainToInstance(FeaturedQueryDto, {
      limit: '13',
    });

    expect(await validate(invalidListQuery)).not.toHaveLength(0);
    expect(await validate(invalidFeaturedQuery)).not.toHaveLength(0);
  });

  it('returns only approved public detail fields and excludes lesson secrets and private instructor data', async () => {
    const rawCourse = {
      _id: new Types.ObjectId(),
      title: 'REST API với NestJS',
      thumbnail: null,
      type: CourseType.PRO,
      level: 'Có cơ bản',
      price: 699000,
      discountPrice: null,
      avgRating: 4.8,
      totalChapters: 1,
      totalLessons: 1,
      totalDuration: 420,
      instructor: {
        _id: new Types.ObjectId(),
        fullName: 'Trần Quốc Bình',
        avatar: null,
        email: 'private@example.com',
        passwordHash: 'not-for-response',
        role: 'INSTRUCTOR',
      },
      category: { _id: new Types.ObjectId(), name: 'Lập trình Backend' },
      description: 'Khóa học REST API.',
      targetAudience: 'Lập trình viên TypeScript.',
      learningOutcomes: ['Tạo REST API.'],
      requirements: 'Biết TypeScript.',
      chapters: [
        {
          _id: new Types.ObjectId(),
          title: 'Kiến trúc NestJS',
          order: 1,
          lessons: [
            {
              _id: new Types.ObjectId(),
              title: '1.1 Module NestJS',
              order: 1,
              duration: 420,
              hasQuiz: false,
              videoUrl: 'PLACEHOLDER_VIDEO',
              note: 'private note',
              summary: 'private summary',
            },
          ],
        },
      ],
    } as CourseDetailAggregateRecord;
    const exec = vi.fn().mockResolvedValue([rawCourse]);
    aggregate.mockReturnValue({ exec });

    const response = await service.getCourseById(rawCourse._id.toString());
    const serialized = JSON.stringify(response);

    expect(response.chapters[0].lessons[0]).toEqual({
      id: rawCourse.chapters[0].lessons[0]._id.toString(),
      title: '1.1 Module NestJS',
      order: 1,
      duration: 420,
      hasQuiz: false,
    });
    expect(serialized).not.toContain('videoUrl');
    expect(serialized).not.toContain('note');
    expect(serialized).not.toContain('summary');
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('role');
  });

  it('returns 404 for malformed or non-approved course ids', async () => {
    await expect(service.getCourseById('invalid')).rejects.toThrow(
      NotFoundException,
    );
    expect(aggregate).not.toHaveBeenCalled();

    const exec = vi.fn().mockResolvedValue([]);
    aggregate.mockReturnValue({ exec });
    await expect(
      service.getCourseById('6650c1f6f2f4f6e4c8bfe125'),
    ).rejects.toThrow(NotFoundException);
  });
});
