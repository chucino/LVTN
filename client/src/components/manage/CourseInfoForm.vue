<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { AlertTriangle, Image, Plus, Trash2, Upload, X } from 'lucide-vue-next';
import { COURSE_LEVELS } from '@/types/course';
import type { Category, CourseLevel, CourseType } from '@/types/course';
import type {
  ManageCourseDetail,
  ManageCoursePayload,
  ManageInstructorOption,
} from '@/types/manage-course';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  save: [payload: ManageCoursePayload, thumbnailFile: File | null];
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
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const localPreviewUrl = ref<string>('');
let initialValue = '';

function revokeLocalPreview() {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
    localPreviewUrl.value = '';
  }
}

function resetFileSelection() {
  revokeLocalPreview();
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function resetForm(course: ManageCourseDetail | null) {
  resetFileSelection();
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

onBeforeUnmount(() => {
  revokeLocalPreview();
});

const isDirty = computed(
  () => JSON.stringify(form) !== initialValue || selectedFile.value !== null,
);
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
  if (!props.isAdmin) {
    return 'Thông tin khóa học nền do Quản trị viên thiết lập và phân công. Giảng viên chỉ xem thông tin tại đây và quản lý Chương, Bài giảng, Trắc nghiệm ở tab Nội dung.';
  }
  return 'Tài khoản hiện tại chỉ có quyền xem khóa học này.';
});

const thumbnailPreview = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value;
  return form.thumbnail.trim();
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function triggerFilePicker() {
  if (props.readOnly || props.busy) return;
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  delete errors.thumbnail;

  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    errors.thumbnail = 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.';
    input.value = '';
    return;
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    errors.thumbnail = 'Dung lượng ảnh không được vượt quá 5MB.';
    input.value = '';
    return;
  }

  revokeLocalPreview();
  selectedFile.value = file;
  localPreviewUrl.value = URL.createObjectURL(file);
}

function clearThumbnail() {
  if (props.readOnly || props.busy) return;
  delete errors.thumbnail;
  if (selectedFile.value) {
    resetFileSelection();
    return;
  }
  form.thumbnail = '';
}

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
  if (selectedFile.value) {
    if (!ALLOWED_IMAGE_MIMES.has(selectedFile.value.type)) {
      errors.thumbnail = 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.';
    } else if (selectedFile.value.size <= 0 || selectedFile.value.size > MAX_IMAGE_SIZE_BYTES) {
      errors.thumbnail = 'Dung lượng ảnh không được vượt quá 5MB.';
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
  if (props.isAdmin) payload.instructorId = form.instructorId;
  emit('save', payload, selectedFile.value);
}
</script>

<template>
  <form data-ui class="space-y-6 bg-surface p-5 sm:p-6" novalidate @submit.prevent="save">
    <div v-if="readOnly" class="manage-alert-warning">
      <AlertTriangle class="h-4 w-4 shrink-0" />
      <span>{{ readOnlyReason }}</span>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <label class="manage-field lg:col-span-2">
        <span>Tên khóa học <span class="text-brand-soft">*</span></span>
        <input v-model="form.title" class="manage-input" type="text" minlength="5" maxlength="150" :disabled="readOnly" autocomplete="off" />
        <span v-if="errors.title" class="manage-field-error">{{ errors.title }}</span>
      </label>

      <label class="manage-field lg:col-span-2">
        <span>Mô tả <span class="text-brand-soft">*</span></span>
        <textarea v-model="form.description" class="manage-input min-h-32" minlength="20" maxlength="5000" :disabled="readOnly" />
        <span class="text-right text-xs tabular-nums text-muted">{{ form.description.length }}/5000</span>
        <span v-if="errors.description" class="manage-field-error">{{ errors.description }}</span>
      </label>

      <label class="manage-field">
        <span>Loại khóa học <span class="text-brand-soft">*</span></span>
        <select v-model="form.type" class="manage-input" :disabled="readOnly || !canChangeType">
          <option value="FREE">Free — miễn phí</option>
          <option value="PRO">Pro — có phí</option>
        </select>
        <span v-if="!canChangeType" class="text-xs text-muted">Chỉ khóa Nháp mới được đổi loại khóa học.</span>
      </label>

      <label class="manage-field">
        <span>Trình độ <span class="text-brand-soft">*</span></span>
        <select v-model="form.level" class="manage-input" :disabled="readOnly">
          <option v-for="level in COURSE_LEVELS" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>

      <label class="manage-field">
        <span>Danh mục <span class="text-brand-soft">*</span></span>
        <select v-model="form.categoryId" class="manage-input" :disabled="readOnly || catalogLoading">
          <option value="" disabled>{{ catalogLoading ? 'Đang tải danh mục…' : 'Chọn danh mục' }}</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <span v-if="errors.categoryId" class="manage-field-error">{{ errors.categoryId }}</span>
      </label>

      <label v-if="isAdmin" class="manage-field">
        <span>Giảng viên phụ trách <span class="text-brand-soft">*</span></span>
        <select v-model="form.instructorId" class="manage-input" :disabled="catalogLoading">
          <option value="" disabled>Chọn giảng viên</option>
          <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">{{ instructor.fullName }} — {{ instructor.email }}</option>
        </select>
        <span v-if="errors.instructorId" class="manage-field-error">{{ errors.instructorId }}</span>
      </label>

      <label class="manage-field lg:col-span-2">
        <span>Khóa học phù hợp với ai? <span class="text-brand-soft">*</span></span>
        <textarea v-model="form.targetAudience" class="manage-input min-h-24" minlength="10" maxlength="1000" :disabled="readOnly" />
        <span v-if="errors.targetAudience" class="manage-field-error">{{ errors.targetAudience }}</span>
      </label>

      <fieldset class="manage-field lg:col-span-2">
        <legend class="mb-2">Bạn học được gì? <span class="text-brand-soft">*</span></legend>
        <div class="space-y-2">
          <div v-for="(_, index) in form.learningOutcomes" :key="index" class="flex items-start gap-2">
            <label class="sr-only" :for="`outcome-${index}`">Mục tiêu học tập {{ index + 1 }}</label>
            <input :id="`outcome-${index}`" v-model="form.learningOutcomes[index]" class="manage-input" type="text" minlength="3" maxlength="200" :disabled="readOnly" :placeholder="`Mục tiêu ${index + 1}`" />
            <button type="button" class="manage-icon-button text-rose-300" :disabled="readOnly || form.learningOutcomes.length <= 1" :aria-label="`Xóa mục tiêu ${index + 1}`" @click="removeOutcome(index)"><Trash2 class="h-4 w-4" /></button>
          </div>
        </div>
        <button type="button" class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-brand-soft disabled:opacity-40" :disabled="readOnly || form.learningOutcomes.length >= 10" @click="addOutcome">
          <Plus class="h-4 w-4" /> Thêm mục tiêu
        </button>
        <span v-if="errors.learningOutcomes" class="manage-field-error">{{ errors.learningOutcomes }}</span>
      </fieldset>

      <label class="manage-field lg:col-span-2">
        <span>Yêu cầu đầu vào <span class="text-brand-soft">*</span></span>
        <textarea v-model="form.requirements" class="manage-input min-h-24" minlength="5" maxlength="1000" :disabled="readOnly" />
        <span v-if="errors.requirements" class="manage-field-error">{{ errors.requirements }}</span>
      </label>
    </div>

    <div class="bg-ground p-5">
      <h2 class="mb-4 text-sm font-semibold text-ink">Giá và ảnh đại diện</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="manage-field">
          <span>Giá (VNĐ)</span>
          <input v-model="form.price" class="manage-input tabular-nums" type="number" min="0" max="100000000" step="1" :disabled="readOnly || form.type === 'FREE'" />
          <span v-if="errors.price" class="manage-field-error">{{ errors.price }}</span>
        </label>
        <label v-if="form.type === 'PRO'" class="manage-field">
          <span>Giá ưu đãi (tùy chọn)</span>
          <input v-model="form.discountPrice" class="manage-input tabular-nums" type="number" min="1" max="100000000" step="1" :disabled="readOnly" />
          <span v-if="errors.discountPrice" class="manage-field-error">{{ errors.discountPrice }}</span>
        </label>

        <div class="manage-field sm:col-span-2">
          <span>Ảnh đại diện khóa học</span>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            :disabled="readOnly || busy"
            @change="handleFileChange"
          />

          <div class="mt-1 flex flex-col gap-4 bg-surface p-4 sm:flex-row sm:items-center">
            <div class="relative flex h-28 w-48 shrink-0 items-center justify-center overflow-hidden bg-ground">
              <img
                v-if="thumbnailPreview"
                :src="thumbnailPreview"
                alt="Xem trước ảnh đại diện khóa học"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex flex-col items-center gap-1.5 text-xs text-muted">
                <Image class="h-6 w-6 text-muted" />
                <span>Chưa có ảnh</span>
              </div>
              <span
                v-if="selectedFile"
                class="absolute bottom-1.5 left-1.5 bg-brand px-2 py-0.5 text-[11px] font-semibold text-white"
              >
                Xem trước (chưa lưu)
              </span>
            </div>

            <div class="flex flex-1 flex-col gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="!readOnly"
                  type="button"
                  class="manage-button-secondary text-xs sm:text-sm"
                  :disabled="busy"
                  @click="triggerFilePicker"
                >
                  <Upload class="h-4 w-4" />
                  {{ thumbnailPreview ? 'Chọn ảnh khác' : 'Tải ảnh từ máy' }}
                </button>
                <button
                  v-if="!readOnly && thumbnailPreview"
                  type="button"
                  class="manage-button-danger text-xs sm:text-sm"
                  :disabled="busy"
                  @click="clearThumbnail"
                >
                  <X class="h-4 w-4" />
                  {{ selectedFile ? 'Hủy ảnh mới chọn' : 'Xóa ảnh hiện tại' }}
                </button>
              </div>

              <p v-if="selectedFile" class="text-xs text-ink">
                Đã chọn: <strong class="font-semibold">{{ selectedFile.name }}</strong> ({{ formatFileSize(selectedFile.size) }}) — Ảnh sẽ được tải lên server khi bấm Lưu.
              </p>
              <p v-else class="text-xs text-muted">
                Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 5MB). Khuyến nghị tỉ lệ 16:9.
              </p>
              <span v-if="errors.thumbnail" class="manage-field-error">{{ errors.thumbnail }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <router-link :to="{ name: 'ManageCourses' }" class="manage-button-secondary text-center">Quay lại danh sách</router-link>
      <button v-if="!readOnly" type="submit" class="manage-button-primary" :disabled="busy || catalogLoading">
        {{ busy ? 'Đang lưu…' : course ? 'Lưu thông tin' : 'Tạo khóa học' }}
      </button>
    </div>
  </form>
</template>
