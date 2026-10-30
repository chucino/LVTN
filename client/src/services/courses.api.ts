import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  Category,
  CourseCard,
  CourseDetail,
  CourseQuery,
  PaginatedCourses,
} from '@/types/course';

export const coursesApi = {
  async getCategories(signal?: AbortSignal): Promise<Category[]> {
    const response = await http.get<ApiResponse<Category[]>>('/categories', {
      signal,
    });
    return response.data.data;
  },

  async getCourses(
    params: CourseQuery = {},
    signal?: AbortSignal,
  ): Promise<PaginatedCourses> {
    const response = await http.get<ApiResponse<PaginatedCourses>>('/courses', {
      params,
      signal,
    });
    return response.data.data;
  },

  async getFeaturedCourses(
    limit = 8,
    signal?: AbortSignal,
  ): Promise<CourseCard[]> {
    const response = await http.get<ApiResponse<CourseCard[]>>(
      '/courses/featured',
      { params: { limit }, signal },
    );
    return response.data.data;
  },

  async getCourseById(
    id: string,
    signal?: AbortSignal,
  ): Promise<CourseDetail> {
    const response = await http.get<ApiResponse<CourseDetail>>(
      `/courses/${encodeURIComponent(id)}`,
      { signal },
    );
    return response.data.data;
  },
};
