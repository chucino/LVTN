export const COURSE_TYPES = ['FREE', 'PRO'] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const COURSE_LEVELS = [
  'Người mới bắt đầu',
  'Có cơ bản',
  'Chuyên nghiệp',
] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
] as const;
export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number]['value'];

export interface Category {
  id: string;
  name: string;
}

export interface CourseInstructor {
  id: string;
  fullName: string;
  avatar: string | null;
}

export interface CourseCategory {
  id: string;
  name: string;
}

export interface CourseCard {
  id: string;
  title: string;
  thumbnail: string | null;
  type: CourseType;
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  avgRating: number;
  totalChapters: number;
  totalLessons: number;
  totalDuration: number;
  instructor: CourseInstructor;
  category: CourseCategory;
}

export interface CourseLesson {
  id: string;
  title: string;
  order: number;
  duration: number;
  hasQuiz: boolean;
}

export interface CourseChapter {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseDetail extends CourseCard {
  description: string;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  chapters: CourseChapter[];
}

export interface PaginatedCourses {
  items: CourseCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseQuery {
  keyword?: string;
  type?: CourseType;
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: CourseSort;
  page?: number;
  limit?: number;
}
