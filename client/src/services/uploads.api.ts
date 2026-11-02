import { http } from '@/services/http';
import type { ApiResponse } from '@/types/auth';

export interface UploadedFileResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export const uploadsService = {
  async uploadImage(
    file: File,
    folder: 'courses' | 'avatars' = 'courses',
  ): Promise<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post<ApiResponse<UploadedFileResponse>>(
      '/uploads/images',
      formData,
      {
        params: { folder },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.data;
  },

  async uploadCourseThumbnail(file: File): Promise<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post<ApiResponse<UploadedFileResponse>>(
      '/uploads/images',
      formData,
      {
        params: { folder: 'courses' },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.data;
  },

  async uploadLessonVideo(
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post<ApiResponse<UploadedFileResponse>>(
      '/uploads/videos',
      formData,
      {
        signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (onProgress && event.total && event.total > 0) {
            const percent = Math.min(
              100,
              Math.round((event.loaded * 100) / event.total),
            );
            onProgress(percent);
          }
        },
      },
    );
    return response.data.data;
  },
};

export const uploadsApi = uploadsService;
