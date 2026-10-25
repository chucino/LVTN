import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import PublicLayout from '@/layouts/PublicLayout.vue';

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

router.beforeEach(async (to, _, next) => {
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
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // Kiểm tra trang dành riêng cho khách chưa đăng nhập (login/register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;
