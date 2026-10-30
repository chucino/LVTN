import { CourseType } from '../../common/constants/course.enum.js';
import { Course } from './schemas/course.schema.js';
import { ManageReadinessDto } from './dto/manage-course-response.dto.js';

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getCourseReadiness(
  course: Pick<
    Course,
    | 'title'
    | 'description'
    | 'type'
    | 'level'
    | 'categoryId'
    | 'targetAudience'
    | 'learningOutcomes'
    | 'requirements'
    | 'price'
    | 'discountPrice'
    | 'chapters'
  >,
): ManageReadinessDto {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!hasText(course.title)) issues.push('Khóa học chưa có tiêu đề.');
  if (!hasText(course.description)) issues.push('Khóa học chưa có mô tả.');
  if (!course.level) issues.push('Khóa học chưa chọn trình độ.');
  if (!course.categoryId) issues.push('Khóa học chưa chọn danh mục.');
  if (!hasText(course.targetAudience)) {
    issues.push('Khóa học chưa mô tả đối tượng học viên phù hợp.');
  }
  if (!hasText(course.requirements)) {
    issues.push('Khóa học chưa có yêu cầu dành cho học viên.');
  }
  if (!course.learningOutcomes?.some((outcome) => hasText(outcome))) {
    issues.push('Khóa học cần có ít nhất một mục tiêu học tập.');
  }
  if (course.type === CourseType.FREE) {
    if (course.price !== 0) issues.push('Khóa học FREE phải có giá bằng 0.');
    if (course.discountPrice !== null) {
      issues.push('Khóa học FREE không được có giá ưu đãi.');
    }
  } else if (course.type === CourseType.PRO) {
    if (course.price <= 0) issues.push('Khóa học PRO phải có giá lớn hơn 0.');
    if (
      course.discountPrice !== null &&
      (course.discountPrice <= 0 || course.discountPrice >= course.price)
    ) {
      issues.push('Giá ưu đãi PRO phải lớn hơn 0 và thấp hơn giá gốc.');
    }
  }

  if (!course.chapters?.length) {
    issues.push('Khóa học cần có ít nhất một chương.');
  }

  course.chapters?.forEach((chapter, chapterIndex) => {
    const chapterLabel = `Chương ${chapterIndex + 1} "${chapter.title}"`;
    if (!chapter.lessons?.length) {
      issues.push(`${chapterLabel} chưa có bài giảng.`);
      return;
    }
    chapter.lessons.forEach((lesson, lessonIndex) => {
      const lessonLabel = `${chapterLabel}, bài ${lessonIndex + 1} "${lesson.title}"`;
      if (!hasText(lesson.videoUrl)) {
        issues.push(`${lessonLabel} chưa có video.`);
      }
      if (!Number.isInteger(lesson.duration) || lesson.duration <= 0) {
        issues.push(`${lessonLabel} chưa có thời lượng hợp lệ.`);
      }
      if (
        course.type === CourseType.PRO &&
        (!hasText(lesson.note) || !hasText(lesson.summary))
      ) {
        warnings.push(`${lessonLabel} chưa có ghi chép hoặc tóm tắt.`);
      }
    });
  });

  return { ready: issues.length === 0, issues, warnings };
}
