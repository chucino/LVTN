import { ref } from 'vue';
import { coursesApi } from '@/services/courses.api';
import { manageCourseService } from '@/services/manage-courses.api';
import { getManageErrorMessage } from '@/lib/manage-course-format';
import type { Category } from '@/types/course';
import type { ManageInstructorOption } from '@/types/manage-course';

export function useManageCatalog() {
  const categories = ref<Category[]>([]);
  const instructors = ref<ManageInstructorOption[]>([]);
  const loadingCatalog = ref(false);
  const catalogError = ref<string | null>(null);

  async function loadCatalog(includeInstructors: boolean) {
    loadingCatalog.value = true;
    catalogError.value = null;
    try {
      const [categoryList, instructorList] = await Promise.all([
        coursesApi.getCategories(),
        includeInstructors ? manageCourseService.instructors() : Promise.resolve([]),
      ]);
      categories.value = categoryList;
      instructors.value = instructorList;
    } catch (error) {
      catalogError.value = getManageErrorMessage(
        error,
        'Không thể tải danh mục hoặc danh sách giảng viên.',
      );
      throw error;
    } finally {
      loadingCatalog.value = false;
    }
  }

  return { categories, instructors, loadingCatalog, catalogError, loadCatalog };
}
