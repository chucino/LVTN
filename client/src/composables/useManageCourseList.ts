import { ref } from 'vue';
import { getManageErrorMessage } from '@/lib/manage-course-format';
import { manageCourseService } from '@/services/manage-courses.api';
import type {
  ManageCourseItem,
  ManageCourseQuery,
  ManageCourseStatus,
} from '@/types/manage-course';

const COURSE_SYNC_CHANNEL = 'nextcode-manage-course-sync';

function notifyCourseSync(courseId?: string) {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(COURSE_SYNC_CHANNEL);
    channel.postMessage({ type: 'course-updated', courseId, timestamp: Date.now() });
    channel.close();
  } catch {
    // Ignore BroadcastChannel errors in unsupported contexts
  }
}

export function useManageCourseList() {
  const items = ref<ManageCourseItem[]>([]);
  const total = ref(0);
  const totalPages = ref(0);
  const loading = ref(false);
  const busyCourseId = ref<string | null>(null);
  const error = ref<string | null>(null);
  let latestLoad = 0;

  async function load(query: ManageCourseQuery, silent = false) {
    const requestId = ++latestLoad;
    if (!silent) {
      loading.value = true;
      error.value = null;
    }
    try {
      const result = await manageCourseService.list(query);
      if (requestId !== latestLoad) return;
      items.value = result.items;
      total.value = result.total;
      totalPages.value = result.totalPages;
    } catch (cause) {
      if (requestId === latestLoad && !silent) {
        error.value = getManageErrorMessage(cause, 'Không thể tải danh sách khóa học.');
      }
    } finally {
      if (requestId === latestLoad && !silent) loading.value = false;
    }
  }

  async function act(
    courseId: string,
    action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete',
    reason?: string,
  ) {
    if (busyCourseId.value) return;
    busyCourseId.value = courseId;
    error.value = null;
    try {
      if (action === 'delete') await manageCourseService.delete(courseId);
      else if (action === 'reject') await manageCourseService.reject(courseId, reason ?? '');
      else await manageCourseService.transition(courseId, action);
      notifyCourseSync(courseId);
    } catch (cause) {
      error.value = getManageErrorMessage(cause, 'Không thể thực hiện thao tác.');
      throw cause;
    } finally {
      busyCourseId.value = null;
    }
  }

  return { items, total, totalPages, loading, busyCourseId, error, load, act };
}

export function isManageCourseStatus(value: unknown): value is ManageCourseStatus {
  return value === 'DRAFT' || value === 'PENDING' || value === 'APPROVED' || value === 'HIDDEN';
}
