import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CourseStatus } from '../../common/constants/course.enum.js';
import { CourseQueryDto, CourseSort } from './dto/course-query.dto.js';
import {
  CategoryResponseDto,
  CourseCardResponseDto,
  CourseDetailResponseDto,
  CourseListResponseDto,
} from './dto/course-response.dto.js';
import { FeaturedQueryDto } from './dto/featured-query.dto.js';
import {
  CourseAggregateRecord,
  CourseDetailAggregateRecord,
  serializeCourseCard,
  serializeCourseDetail,
} from './serializers/course.serializer.js';
import { Category } from './schemas/category.schema.js';
import { Course } from './schemas/course.schema.js';
import { recalculateCourseTotals } from './course-totals.js';

interface CourseListAggregateResult {
  items: CourseAggregateRecord[];
  totalCount: Array<{ total: number }>;
}

const courseCardProjection = {
  _id: 1,
  title: 1,
  thumbnail: { $ifNull: ['$thumbnail', null] },
  type: 1,
  level: 1,
  price: 1,
  discountPrice: { $ifNull: ['$discountPrice', null] },
  avgRating: 1,
  totalChapters: 1,
  totalLessons: 1,
  totalDuration: 1,
  instructor: {
    _id: '$instructor._id',
    fullName: '$instructor.fullName',
    avatar: { $ifNull: ['$instructor.avatar', null] },
  },
  category: {
    _id: '$category._id',
    name: '$category.name',
  },
};

const courseLookupStages = [
  {
    $lookup: {
      from: 'users',
      localField: 'instructorId',
      foreignField: '_id',
      pipeline: [{ $project: { fullName: 1, avatar: 1 } }],
      as: 'instructor',
    },
  },
  { $unwind: '$instructor' },
  {
    $lookup: {
      from: 'categories',
      localField: 'categoryId',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1 } }],
      as: 'category',
    },
  },
  { $unwind: '$category' },
  {
    $project: {
      ...courseCardProjection,
    },
  },
] satisfies PipelineStage[];

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sortFor(sort: CourseSort): Record<string, 1 | -1> {
  switch (sort) {
    case CourseSort.PRICE_ASC:
      return { effectivePrice: 1, createdAt: -1, _id: -1 };
    case CourseSort.PRICE_DESC:
      return { effectivePrice: -1, createdAt: -1, _id: -1 };
    case CourseSort.RATING_DESC:
      return { avgRating: -1, createdAt: -1, _id: -1 };
    default:
      return { createdAt: -1, _id: -1 };
  }
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async getCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryModel
      .find({}, { _id: 1, name: 1 })
      .sort({ name: 1 })
      .lean()
      .exec();

    return categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
    }));
  }

  async getCourses(query: CourseQueryDto): Promise<CourseListResponseDto> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice không được lớn hơn maxPrice');
    }

    const match: Record<string, unknown> = {
      status: CourseStatus.APPROVED,
    };

    if (query.keyword) {
      match.title = {
        $regex: escapeRegularExpression(query.keyword.trim()),
        $options: 'i',
      };
    }
    if (query.type) match.type = query.type;
    if (query.categoryId)
      match.categoryId = new Types.ObjectId(query.categoryId);
    if (query.level) match.level = query.level;
    if (query.minRating !== undefined) {
      match.avgRating = { $gte: query.minRating };
    }

    const pipeline: PipelineStage[] = [{ $match: match }];
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      pipeline.push({
        $addFields: {
          effectivePrice: { $ifNull: ['$discountPrice', '$price'] },
        },
      });
      const priceRange: Record<string, number> = {};
      if (query.minPrice !== undefined) priceRange.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceRange.$lte = query.maxPrice;
      pipeline.push({ $match: { effectivePrice: priceRange } });
    } else {
      pipeline.push({
        $addFields: {
          effectivePrice: { $ifNull: ['$discountPrice', '$price'] },
        },
      });
    }

    const offset = (query.page - 1) * query.limit;
    pipeline.push({
      $facet: {
        items: [
          { $sort: sortFor(query.sort) },
          { $skip: offset },
          { $limit: query.limit },
          ...courseLookupStages,
        ],
        totalCount: [{ $count: 'total' }],
      },
    });

    const [result] = await this.courseModel
      .aggregate<CourseListAggregateResult>(pipeline)
      .exec();
    const total = result?.totalCount[0]?.total ?? 0;

    return {
      items: (result?.items ?? []).map(serializeCourseCard),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  async getFeaturedCourses(
    query: FeaturedQueryDto,
  ): Promise<CourseCardResponseDto[]> {
    const pipeline: PipelineStage[] = [
      { $match: { status: CourseStatus.APPROVED } },
      { $sort: { avgRating: -1, createdAt: -1, _id: -1 } },
      { $limit: query.limit },
      ...courseLookupStages,
    ];
    const courses = await this.courseModel
      .aggregate<CourseAggregateRecord>(pipeline)
      .exec();

    return courses.map(serializeCourseCard);
  }

  async getCourseById(id: string): Promise<CourseDetailResponseDto> {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const [course] = await this.courseModel
      .aggregate<CourseDetailAggregateRecord>([
        {
          $match: {
            _id: new Types.ObjectId(id),
            status: CourseStatus.APPROVED,
          },
        },
        ...courseLookupStages.slice(0, 4),
        {
          $project: {
            ...courseCardProjection,
            description: 1,
            targetAudience: 1,
            learningOutcomes: 1,
            requirements: 1,
            chapters: 1,
          },
        },
        { $limit: 1 },
      ])
      .exec();

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    return serializeCourseDetail(course);
  }

  async recalculateTotals(
    courseId: string | Types.ObjectId,
  ): Promise<Pick<Course, 'totalChapters' | 'totalLessons' | 'totalDuration'>> {
    return recalculateCourseTotals(this.courseModel, courseId);
  }
}
