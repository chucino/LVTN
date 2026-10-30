<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { AlertTriangle, Image, Plus, Trash2 } from 'lucide-vue-next';
import { COURSE_LEVELS } from '@/types/course';
import type { Category, CourseLevel, CourseType } from '@/types/course';
import type {
  ManageCourseDetail,
  ManageCoursePayload,
  ManageInstructorOption,
} from '@/types/manage-course';

const props = defineProps<{
  course: ManageCourseDetail | null;
  categories: Category[];
  instructors: ManageInstructorOption[];
  isAdmin: boolean;
  busy?: boolean;
  readOnly?: boolean;
  catalogLoading?: boolean;
}>();
const emit = defineEmits<{
  save: [payload: ManageCoursePayload];
  dirty: [value: boolean];
}>();

interface CourseForm {
  title: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  categoryId: string;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  price: string;
  discountPrice: string;
  thumbnail: string;
  instructorId: string;
}

function blankForm(): CourseForm {
  return {
    title: '',
    description: '',
    type: 'FREE',
    level: COURSE_LEVELS[0],
    categoryId: '',
    targetAudience: '',
    learningOutcomes: [''],
    requirements: '',
    price: '0',
    discountPrice: '',
    thumbnail: '',
    instructorId: '',
  };
}

const form = reactive<CourseForm>(blankForm());
const errors = reactive<Record<string, string>>({});
let initialValue = '';

function resetForm(course: ManageCourseDetail | null) {
  const next = course
    ? {
        title: course.title,
        description: course.description,
        type: course.type,
        level: course.level,
        categoryId: course.category.id,
        targetAudience: course.targetAudience,
        learningOutcomes: [...course.learningOutcomes],
        requirements: course.requirements,
        price: String(course.price),
        discountPrice: course.discountPrice === null ? '' : String(course.discountPrice),
        thumbnail: course.thumbnail ?? '',
        instructorId: course.instructor.id,
      }
    : blankForm();
  Object.assign(form, next);
  form.learningOutcomes = next.learningOutcomes.length ? [...next.learningOutcomes] : [''];
  initialValue = JSON.stringify(form);
  Object.keys(errors).forEach((key) => delete errors[key]);
}

watch(() => props.course, resetForm, { immediate: true, deep: true });

const isDirty = computed(() => JSON.stringify(form) !== initialValue);
watch(isDirty, (dirty) => emit('dirty', dirty), { immediate: true });

watch(
  () => form.type,
  (type, previous) => {
    if (type === 'FREE') {
      form.price = '0';
      form.discountPrice = '';
    } else if (previous === 'FREE' && !form.price) {
      form.price = '1';
    }
  },
);

const canChangeType = computed(
  () => !props.course || props.course.status === 'DRAFT',
);
const readOnlyReason = computed(() => {
  if (!props.course || !props.readOnly) return '';
  if (props.course.status === 'PENDING') return 'Khóa học đang chờ duyệt nên hiện không thể chỉnh sửa.';
  if (props.course.status === 'HIDDEN') return 'Khóa học đang bị ẩn và tài khoản hiện tại chỉ có quyền xem.';
  return 'Tài khoản hiện tại chỉ có quyền xem khóa học này.';
});
const thumbnailPreview = computed(() => {
  if (!form.thumbnail.trim()) return '';
  try {
    const url = new URL(form.thumbnail);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
});

function addOutcome() {
  if (form.learningOutcomes.length < 10) form.learningOutcomes.push('');
}

function removeOutcome(index: number) {
  if (form.learningOutcomes.length > 1) form.learningOutcomes.splice(index, 1);
}

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
  const title = form.title.trim();
  const description = form.description.trim();
  const targetAudience = form.targetAudience.trim();
  const requirements = form.requirements.trim();
  const price = Number(form.price);
  const discountPrice = form.discountPrice.trim() ? Number(form.discountPrice) : null;

  if (title.length < 5 || title.length > 150) errors.title = 'Tên khóa học phải từ 5 đến 150 ký tự.';
  if (description.length < 20 || description.length > 5000) errors.description = 'Mô tả phải từ 20 đến 5000 ký tự.';
  if (!form.categoryId) errors.categoryId = 'Vui lòng chọn danh mục.';
  if (targetAudience.length < 10 || targetAudience.length > 1000) errors.targetAudience = 'Nội dung phải từ 10 đến 1000 ký tự.';
  const outcomes = form.learningOutcomes.map((item) => item.trim());
  if (outcomes.length < 1 || outcomes.length > 10 || outcomes.some((item) => item.length < 3 || item.length > 200)) {
    errors.learningOutcomes = 'Cần từ 1 đến 10 mục tiêu, mỗi mục từ 3 đến 200 ký tự.';
  }
  if (requirements.length < 5 || requirements.length > 1000) errors.requirements = 'Yêu cầu phải từ 5 đến 1000 ký tự.';
  if (!Number.isInteger(price) || price < 0 || price > 100_000_000) errors.price = 'Giá phải là số nguyên từ 0 đến 100.000.000đ.';
  if (form.type === 'FREE' && price !== 0) errors.price = 'Khóa Free phải có giá bằng 0.';
  if (form.type === 'PRO' && price <= 0) errors.price = 'Khóa Pro phải có giá lớn hơn 0.';
  if (discountPrice !== null && (!Number.isInteger(discountPrice) || discountPrice <= 0 || discountPrice >= price || discountPrice > 100_000_000)) {
    errors.discountPrice = 'Giá ưu đãi phải lớn hơn 0 và thấp hơn giá gốc.';
  }
  if (form.thumbnail.trim()) {
    try {
      if (new URL(form.thumbnail).protocol !== 'https:' || form.thumbnail.length > 500) {
        errors.thumbnail = 'Ảnh phải là URL HTTPS không quá 500 ký tự.';
      }
    } catch {
      errors.thumbnail = 'Vui lòng nhập URL ảnh HTTPS hợp lệ.';
    }
  }
  if (props.isAdmin && !form.instructorId) errors.instructorId = 'Admin cần chọn giảng viên phụ trách.';
  return Object.keys(errors).length === 0;
}

function save() {
  if (props.readOnly || props.busy || !validate()) return;
  const price = Number(form.price);
  const discountPrice = form.discountPrice.trim() ? Number(form.discountPrice) : null;
  if (
    props.course?.status === 'DRAFT' &&
    props.course.type === 'PRO' &&
    form.type === 'FREE' &&
    !window.confirm('Đổi khóa PRO sang FREE sẽ xóa ghi chép và tóm tắt của tất cả bài giảng. Bạn có muốn tiếp tục lưu không?')
  ) {
    return;
  }
  const payload: ManageCoursePayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    level: form.level,
    categoryId: form.categoryId,
    targetAudience: form.targetAudience.trim(),
    learningOutcomes: form.learningOutcomes.map((item) => item.trim()),
    requirements: form.requirements.trim(),
    price,
    discountPrice: form.type === 'FREE' ? null : discountPrice,
    thumbnail: form.thumbnail.trim() || null,
  };
  if (!props.course && props.isAdmin) payload.instructorId = form.instructorId;
  emit('save', payload);
}
</script>

<template>
  <form class="manage-panel space-y-6 p-4 sm:p-6" novalidate @submit.prevent="save">
    <div v-if="readOnly" class="manage-alert-warning">
      <AlertTriangle class="h-4 w-4 shrink-0" />
      <span>{{ readOnlyReason }}</span>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <label class="manage-field lg:col-span-2">
        Tên khóa học <span class="text-rose-300">*</span>
        <input v-model="form.title" class="manage-input" type="text" minlength="5" maxlength="150" :disabled="readOnly" autocomplete="off" />
        <span v-if="errors.title" class="manage-field-error">{{ errors.title }}</span>
      </label>

      <label class="manage-field lg:col-span-2">
        Mô tả <span class="text-rose-300">*</span>
        <textarea v-model="form.description" class="manage-input min-h-32" minlength="20" maxlength="5000" :disabled="readOnly" />
        <span class="text-right text-xs text-slate-500">{{ form.description.length }}/5000</span>
        <span v-if="errors.description" class="manage-field-error">{{ errors.description }}</span>
      </label>

      <label class="manage-field">
        Loại khóa học <span class="text-rose-300">*</span>
        <select v-model="form.type" class="manage-input" :disabled="readOnly || !canChangeType">
          <option value="FREE">Free — miễn phí</option>
          <option value="PRO">Pro — có phí</option>
        </select>
        <span v-if="!canChangeType" class="text-xs text-slate-500">Chỉ khóa Nháp mới được đổi loại khóa học.</span>
      </label>

      <label class="manage-field">
        Trình độ <span class="text-rose-300">*</span>
        <select v-model="form.level" class="manage-input" :disabled="readOnly">
          <option v-for="level in COURSE_LEVELS" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>

      <label class="manage-field">
        Danh mục <span class="text-rose-300">*</span>
        <select v-model="form.categoryId" class="manage-input" :disabled="readOnly || catalogLoading">
          <option value="" disabled>{{ catalogLoading ? 'Đang tải danh mục…' : 'Chọn danh mục' }}</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <span v-if="errors.categoryId" class="manage-field-error">{{ errors.categoryId }}</span>
      </label>

      <label v-if="!props.course && isAdmin" class="manage-field">
        Giảng viên phụ trách <span class="text-rose-300">*</span>
        <select v-model="form.instructorId" class="manage-input" :disabled="catalogLoading">
          <option value="" disabled>Chọn giảng viên</option>
          <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">{{ instructor.fullName }} — {{ instructor.email }}</option>
        </select>
        <span v-if="errors.instructorId" class="manage-field-error">{{ errors.instructorId }}</span>
      </label>

      <label class="manage-field lg:col-span-2">
        Khóa học phù hợp với ai? <span class="text-rose-300">*</span>
        <textarea v-model="form.targetAudience" class="manage-input min-h-24" minlength="10" maxlength="1000" :disabled="readOnly" />
        <span v-if="errors.targetAudience" class="manage-field-error">{{ errors.targetAudience }}</span>
      </label>

      <fieldset class="manage-field lg:col-span-2">
        <legend class="mb-2">Bạn học được gì? <span class="text-rose-300">*</span></legend>
        <div class="space-y-2">
          <div v-for="(_, index) in form.learningOutcomes" :key="index" class="flex items-start gap-2">
            <label class="sr-only" :for="`outcome-${index}`">Mục tiêu học tập {{ index + 1 }}</label>
            <input :id="`outcome-${index}`" v-model="form.learningOutcomes[index]" class="manage-input" type="text" minlength="3" maxlength="200" :disabled="readOnly" :placeholder="`Mục tiêu ${index + 1}`" />
            <button type="button" class="manage-icon-button text-rose-300" :disabled="readOnly || form.learningOutcomes.length <= 1" :aria-label="`Xóa mục tiêu ${index + 1}`" @click="removeOutcome(index)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
        <button type="button" class="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200 hover:text-white disabled:opacity-40" :disabled="readOnly || form.learningOutcomes.length >= 10" @click="addOutcome">
          <Plus class="h-4 w-4" /> Thêm mục tiêu
        </button>
        <span v-if="errors.learningOutcomes" class="manage-field-error">{{ errors.learningOutcomes }}</span>
      </fieldset>

      <label class="manage-field lg:col-span-2">
        Yêu cầu đầu vào <span class="text-rose-300">*</span>
        <textarea v-model="form.requirements" class="manage-input min-h-24" minlength="5" maxlength="1000" :disabled="readOnly" />
        <span v-if="errors.requirements" class="manage-field-error">{{ errors.requirements }}</span>
      </label>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <h2 class="mb-4 text-sm font-bold text-white">Giá và ảnh đại diện</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="manage-field">
          Giá (VNĐ)
          <input v-model="form.price" class="manage-input" type="number" min="0" max="100000000" step="1" :disabled="readOnly || form.type === 'FREE'" />
          <span v-if="errors.price" class="manage-field-error">{{ errors.price }}</span>
        </label>
        <label v-if="form.type === 'PRO'" class="manage-field">
          Giá ưu đãi (tùy chọn)
          <input v-model="form.discountPrice" class="manage-input" type="number" min="1" max="100000000" step="1" :disabled="readOnly" />
          <span v-if="errors.discountPrice" class="manage-field-error">{{ errors.discountPrice }}</span>
        </label>
        <label class="manage-field sm:col-span-2">
          URL ảnh đại diện
          <input v-model="form.thumbnail" class="manage-input" type="url" maxlength="500" placeholder="https://example.com/course-cover.jpg" :disabled="readOnly" />
          <span v-if="errors.thumbnail" class="manage-field-error">{{ errors.thumbnail }}</span>
        </label>
      </div>
      <div v-if="thumbnailPreview" class="mt-4 flex items-center gap-3">
        <img :src="thumbnailPreview" alt="Xem trước ảnh đại diện khóa học" class="h-20 w-32 rounded-xl border border-slate-700 object-cover" />
        <span class="inline-flex items-center gap-1.5 text-xs text-slate-400"><Image class="h-4 w-4" /> Xem trước ảnh</span>
      </div>
      <p v-else-if="form.thumbnail" class="mt-3 text-xs text-amber-200">Nhập URL HTTPS hợp lệ để xem trước ảnh.</p>
    </div>

    <div class="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
      <router-link :to="{ name: 'ManageCourses' }" class="manage-button-secondary text-center">Quay lại danh sách</router-link>
      <button v-if="!readOnly" type="submit" class="manage-button-primary" :disabled="busy || catalogLoading">
        {{ busy ? 'Đang lưu…' : course ? 'Lưu thông tin' : 'Tạo khóa học' }}
      </button>
    </div>
  </form>
</template>
