import { http } from '@/services/http';
import type { ApiResponse, Role, User } from '@/types/auth';
import type {
  ChangePasswordPayload,
  CreateManageUserPayload,
  ManageUserListResponse,
  ManageUserQuery,
  UpdateProfilePayload,
} from '@/types/user';

export const usersApi = {
  async getProfile(): Promise<User> {
    const res = await http.get<ApiResponse<User>>('/users/profile');
    return res.data.data;
  },

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<{ message: string; user: User }> {
    const res = await http.patch<ApiResponse<{ message: string; user: User }>>(
      '/users/profile',
      payload,
    );
    return res.data.data;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<{ message: string }> {
    const res = await http.patch<ApiResponse<{ message: string }>>(
      '/users/profile/password',
      payload,
    );
    return res.data.data;
  },

  async listManageUsers(
    query: ManageUserQuery,
  ): Promise<ManageUserListResponse> {
    const res = await http.get<ApiResponse<ManageUserListResponse>>(
      '/manage/users',
      { params: query },
    );
    return res.data.data;
  },

  async createManageUser(
    payload: CreateManageUserPayload,
  ): Promise<{ message: string; user: User }> {
    const res = await http.post<ApiResponse<{ message: string; user: User }>>(
      '/manage/users',
      payload,
    );
    return res.data.data;
  },

  async updateManageUserRole(
    userId: string,
    role: Role,
  ): Promise<{ message: string; user: User }> {
    const res = await http.patch<ApiResponse<{ message: string; user: User }>>(
      `/manage/users/${userId}/role`,
      { role },
    );
    return res.data.data;
  },

  async updateManageUserStatus(
    userId: string,
    status: 'ACTIVE' | 'LOCKED',
  ): Promise<{ message: string; user: User }> {
    const res = await http.patch<ApiResponse<{ message: string; user: User }>>(
      `/manage/users/${userId}/status`,
      { status },
    );
    return res.data.data;
  },
};

