import type { Role, User, UserStatus } from '@/types/auth';

export type ProfileTab = 'info' | 'courses' | 'certificates' | 'security';

export interface UpdateProfilePayload {
  fullName?: string;
  dateOfBirth?: string | null;
  occupation?: string | null;
  avatar?: string | null;
  interestedCategories?: string[];
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ManageUserSort = 'newest' | 'oldest' | 'name_asc';

export interface ManageUserQuery {
  keyword?: string;
  role?: Role;
  status?: UserStatus;
  sort?: ManageUserSort;
  page?: number;
  limit?: number;
}

export interface ManageUserStats {
  total: number;
  students: number;
  instructors: number;
  admins: number;
  locked: number;
}

export interface ManageUserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: ManageUserStats;
}

export interface CreateManageUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  occupation?: string;
  dateOfBirth?: string;
}
