import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  CertificateItem,
  CertificateVerifyResult,
} from '@/types/learning';

export const certificatesApi = {
  async getMyCertificates(signal?: AbortSignal): Promise<CertificateItem[]> {
    const response = await http.get<ApiResponse<CertificateItem[]>>(
      '/certificates/my',
      { signal },
    );
    return response.data.data;
  },

  async verifyCertificate(
    code: string,
    signal?: AbortSignal,
  ): Promise<CertificateVerifyResult> {
    const response = await http.get<ApiResponse<CertificateVerifyResult>>(
      `/certificates/verify/${encodeURIComponent(code.trim().toUpperCase())}`,
      { signal },
    );
    return response.data.data;
  },
};

