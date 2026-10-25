export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ACCOUNTANT' | 'ADMIN';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'LOCKED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar?: string | null;
  dateOfBirth?: string | null;
  occupation?: string | null;
  interestedCategories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  timestamp: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
  email?: string;
  user?: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  occupation?: string;
  avatar?: string;
  interestedCategories?: string[];
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
  purpose: 'REGISTER' | 'RESET_PASSWORD';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AssignRolePayload {
  role: Role;
}
