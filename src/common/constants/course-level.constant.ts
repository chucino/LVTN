export const COURSE_LEVELS = [
  'Người mới bắt đầu',
  'Có cơ bản',
  'Chuyên nghiệp',
] as const;

export type CourseLevel = (typeof COURSE_LEVELS)[number];
