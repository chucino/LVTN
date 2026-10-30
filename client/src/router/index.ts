import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import PublicLayout from '@/layouts/PublicLayout.vue';
import type { Role } from '@/types/auth';

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/pages/public/HomePage.vue'),
        meta: { title: 'NextCode - Học hôm nay, kiến tạo ngày mai' },
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/pages/public/CoursesPage.vue'),
        meta: { title: 'Khóa học lập trình - NextCode' },
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: () => import('@/pages/public/CourseDetailPage.vue'),
        meta: { title: 'Chi tiết khóa học - NextCode' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/public/LoginPage.vue'),
    meta: { guestOnly: true, title: 'Đăng nhập - NextCode' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/public/RegisterPage.vue'),
    meta: { guestOnly: true, title: 'Đăng ký tài khoản - NextCode' },
  },
  {
    path: '/verify-otp',
    name: 'VerifyOtp',
    component: () => import('@/pages/public/VerifyOtpPage.vue'),
    meta: { title: 'Xác thực OTP - NextCode' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/pages/public/ForgotPasswordPage.vue'),
    meta: { guestOnly: true, title: 'Quên mật khẩu - NextCode' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/pages/public/ResetPasswordPage.vue'),
    meta: { title: 'Đặt lại mật khẩu - NextCode' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/dashboard/DashboardPage.vue'),
    meta: { requiresAuth: true, title: 'Bảng điều khiển - NextCode' },
  },
  {
    path: '/manage',
    component: () => import('@/layouts/ManageLayout.vue'),
    meta: {
      requiresAuth: true,
      roles: ['INSTRUCTOR', 'ADMIN'] as Role[],
    },
    children: [
      {
        path: 'courses',
        name: 'ManageCourses',
        component: () => import('@/pages/manage/ManageCoursesPage.vue'),
        meta: { title: 'Quản lý khóa học - NextCode' },
      },
      {
        path: 'courses/new',
        name: 'ManageCourseCreate',
        component: () => import('@/pages/manage/ManageCourseEditPage.vue'),
        meta: { title: 'Tạo khóa học - NextCode' },
      },
      {
        path: 'courses/:id/edit',
        name: 'ManageCourseEdit',
        component: () => import('@/pages/manage/ManageCourseEditPage.vue'),
        meta: { title: 'Chỉnh sửa khóa học - NextCode' },
      },
    ],
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
    meta: { title: 'Không có quyền truy cập - NextCode' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
let sessionRestored = false;

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Thử khôi phục session bằng cookie refresh token một lần lúc đầu
  if (!sessionRestored) {
    sessionRestored = true;
    await authStore.refreshSession();
  }

  // Cập nhật tiêu đề trang
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // Kiểm tra yêu cầu đăng nhập
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  // Kiểm tra trang dành riêng cho khách chưa đăng nhập (login/register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'Home' };
  }

  const allowedRoles = to.meta.roles as Role[] | undefined;
  if (
    allowedRoles &&
    (!authStore.user || !allowedRoles.includes(authStore.user.role))
  ) {
    return { name: 'Forbidden' };
  }

  return true;
});

export default router;
