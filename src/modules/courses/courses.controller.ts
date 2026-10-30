import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  SchemaObject,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CourseQueryDto, CourseSort } from './dto/course-query.dto.js';
import {
  CategoryResponseDto,
  CourseCardResponseDto,
  CourseDetailResponseDto,
  CourseListResponseDto,
} from './dto/course-response.dto.js';
import { FeaturedQueryDto } from './dto/featured-query.dto.js';
import { CoursesService } from './courses.service.js';
import { COURSE_LEVELS } from '../../common/constants/course-level.constant.js';
import { CourseType } from '../../common/constants/course.enum.js';

function responseEnvelope(data: SchemaObject): SchemaObject {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      statusCode: { type: 'number', example: 200 },
      data,
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-26T00:00:00.000Z',
      },
    },
  };
}

@ApiTags('Public Courses')
@ApiExtraModels(
  CategoryResponseDto,
  CourseListResponseDto,
  CourseCardResponseDto,
  CourseDetailResponseDto,
)
@Public()
@Controller()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách danh mục khóa học' })
  @ApiResponse({
    status: 200,
    schema: responseEnvelope({
      type: 'array',
      items: { $ref: getSchemaPath(CategoryResponseDto) },
    }),
  })
  getCategories(): Promise<CategoryResponseDto[]> {
    return this.coursesService.getCategories();
  }

  @Get('courses')
  @ApiOperation({ summary: 'Tìm kiếm, lọc và phân trang khóa học đã duyệt' })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
    description: 'Tìm theo tên khóa, không phân biệt hoa thường',
  })
  @ApiQuery({ name: 'type', required: false, enum: CourseType })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Mongo ObjectId của danh mục',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: COURSE_LEVELS,
    description: 'Người mới bắt đầu | Có cơ bản | Chuyên nghiệp',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    minimum: 0,
    description: 'Giá hiệu lực thấp nhất (VND)',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    minimum: 0,
    description: 'Giá hiệu lực cao nhất (VND)',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    minimum: 0,
    maximum: 5,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: CourseSort,
    example: CourseSort.NEWEST,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 50,
    example: 12,
  })
  @ApiResponse({
    status: 200,
    schema: responseEnvelope({
      allOf: [{ $ref: getSchemaPath(CourseListResponseDto) }],
    }),
  })
  @ApiResponse({ status: 400, description: 'Query parameter không hợp lệ' })
  getCourses(@Query() query: CourseQueryDto): Promise<CourseListResponseDto> {
    return this.coursesService.getCourses(query);
  }

  @Get('courses/featured')
  @ApiOperation({ summary: 'Lấy khóa học nổi bật cho trang chủ' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 12,
    example: 8,
  })
  @ApiResponse({
    status: 200,
    schema: responseEnvelope({
      type: 'array',
      items: { $ref: getSchemaPath(CourseCardResponseDto) },
    }),
  })
  @ApiResponse({
    status: 400,
    description: 'limit phải là số nguyên từ 1 đến 12',
  })
  getFeaturedCourses(
    @Query() query: FeaturedQueryDto,
  ): Promise<CourseCardResponseDto[]> {
    return this.coursesService.getFeaturedCourses(query);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Xem chi tiết khóa học đã duyệt' })
  @ApiParam({
    name: 'id',
    description: 'Mongo ObjectId của khóa học',
    example: '6650c1f6f2f4f6e4c8bfe125',
  })
  @ApiResponse({
    status: 200,
    schema: responseEnvelope({
      allOf: [{ $ref: getSchemaPath(CourseDetailResponseDto) }],
    }),
  })
  @ApiResponse({
    status: 404,
    description: 'Khóa học không tồn tại hoặc chưa được duyệt',
  })
  getCourseById(@Param('id') id: string): Promise<CourseDetailResponseDto> {
    return this.coursesService.getCourseById(id);
  }
}
