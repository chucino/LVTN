import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PAYOS_API_BASE_URL = 'https://api-merchant.payos.vn/v2/payment-requests';

const BANK_BIN_NAMES: Record<string, string> = {
  '970422': 'MB Bank (Ngân hàng Quân đội)',
  '970416': 'ACB (Ngân hàng Á Châu)',
  '970418': 'BIDV (Đầu tư & Phát triển VN)',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970407': 'Techcombank',
  '970405': 'Agribank',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970448': 'OCB (Ngân hàng Phương Đông)',
  '970426': 'MSB (Ngân hàng Hàng Hải)',
  '970452': 'KienlongBank',
  '970446': 'Co-opBank',
};

export interface CreatePayosPaymentParams {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
}

export interface PayosPaymentLinkResult {
  bin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
  qrImageUrl: string;
}

export interface PayosTransactionItem {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
}

export interface PayosPaymentLinkInfo {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | string;
  transactions: PayosTransactionItem[];
}

function sortObjDataByKey(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function convertObjToQueryStr(obj: Record<string, unknown>): string {
  return Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .map((key) => {
      let value = obj[key];
      if (value && Array.isArray(value)) {
        value = JSON.stringify(
          value.map((val) =>
            val && typeof val === 'object'
              ? sortObjDataByKey(val as Record<string, unknown>)
              : val,
          ),
        );
      }
      if (value === null || value === undefined || value === 'null' || value === 'undefined') {
        value = '';
      }
      return `${key}=${String(value)}`;
    })
    .join('&');
}

export function resolveBankNameFromBin(bin?: string | null): string {
  if (!bin) return 'Ngân hàng Napas 247';
  return BANK_BIN_NAMES[bin.trim()] ?? `Ngân hàng (BIN ${bin})`;
}

export function buildVietQrImageUrl(params: {
  bin: string;
  accountNumber: string;
  amount: number;
  description: string;
  accountName?: string | null;
}): string {
  const query = new URLSearchParams({
    amount: String(Math.round(params.amount)),
    addInfo: params.description,
  });
  if (params.accountName) {
    query.set('accountName', params.accountName);
  }
  return `https://img.vietqr.io/image/${encodeURIComponent(params.bin)}-${encodeURIComponent(params.accountNumber)}-compact2.png?${query.toString()}`;
}

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);

  constructor(private readonly configService: ConfigService) {}

  private getCredentials(): {
    clientId: string;
    apiKey: string;
    checksumKey: string;
  } {
    return {
      clientId: this.configService.get<string>('PAYOS_CLIENT_ID', '').trim(),
      apiKey: this.configService.get<string>('PAYOS_API_KEY', '').trim(),
      checksumKey: this.configService
        .get<string>('PAYOS_CHECKSUM_KEY', '')
        .trim(),
    };
  }

  isConfigured(): boolean {
    const { clientId, apiKey, checksumKey } = this.getCredentials();
    return Boolean(
      clientId &&
        apiKey &&
        checksumKey &&
        clientId !== 'your_payos_client_id',
    );
  }

  createPaymentRequestSignature(params: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  }): string {
    const { checksumKey } = this.getCredentials();
    const dataStr = [
      `amount=${params.amount}`,
      `cancelUrl=${params.cancelUrl}`,
      `description=${params.description}`,
      `orderCode=${params.orderCode}`,
      `returnUrl=${params.returnUrl}`,
    ].join('&');
    return createHmac('sha256', checksumKey).update(dataStr).digest('hex');
  }

  verifyWebhookSignature(
    data: Record<string, unknown>,
    signature: string,
  ): boolean {
    const { checksumKey } = this.getCredentials();
    if (!checksumKey || !signature || !data || typeof data !== 'object') {
      return false;
    }

    const sortedData = sortObjDataByKey(data);
    const queryStr = convertObjToQueryStr(sortedData);
    const computedHex = createHmac('sha256', checksumKey)
      .update(queryStr)
      .digest('hex');

    try {
      const a = Buffer.from(computedHex, 'hex');
      const b = Buffer.from(signature.trim(), 'hex');
      if (a.length !== b.length || a.length === 0) {
        return false;
      }
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  async createPaymentLink(
    params: CreatePayosPaymentParams,
  ): Promise<PayosPaymentLinkResult> {
    const { clientId, apiKey } = this.getCredentials();
    const signature = this.createPaymentRequestSignature({
      amount: params.amount,
      cancelUrl: params.cancelUrl,
      description: params.description,
      orderCode: params.orderCode,
      returnUrl: params.returnUrl,
    });

    const payload: Record<string, unknown> = {
      orderCode: params.orderCode,
      amount: params.amount,
      description: params.description,
      cancelUrl: params.cancelUrl,
      returnUrl: params.returnUrl,
      signature,
    };
    if (params.expiredAt) {
      payload.expiredAt = params.expiredAt;
    }

    let response: Response;
    try {
      response = await fetch(PAYOS_API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.error('Không thể kết nối tới cổng thanh toán payOS', err);
      throw new BadGatewayException(
        'Không thể kết nối tới cổng thanh toán payOS. Vui lòng thử lại sau.',
      );
    }

    const body = (await response.json().catch(() => null)) as {
      code?: string;
      desc?: string;
      data?: {
        bin: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        description: string;
        orderCode: number;
        currency?: string;
        paymentLinkId: string;
        status: string;
        checkoutUrl: string;
        qrCode: string;
      } | null;
    } | null;

    if (!response.ok || !body || body.code !== '00' || !body.data) {
      this.logger.warn(
        `payOS từ chối tạo link thanh toán (code=${body?.code ?? response.status}): ${body?.desc ?? 'Unknown error'}`,
      );
      throw new BadGatewayException(
        body?.desc || 'Không thể khởi tạo mã thanh toán VietQR từ payOS',
      );
    }

    const data = body.data;
    const bankName = resolveBankNameFromBin(data.bin);
    const qrImageUrl = buildVietQrImageUrl({
      bin: data.bin,
      accountNumber: data.accountNumber,
      amount: data.amount,
      description: data.description,
      accountName: data.accountName,
    });

    return {
      bin: data.bin,
      bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      amount: data.amount,
      description: data.description,
      orderCode: data.orderCode,
      currency: data.currency ?? 'VND',
      paymentLinkId: data.paymentLinkId,
      status: data.status,
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      qrImageUrl,
    };
  }

  async getPaymentLinkInfo(
    payosOrderCode: number,
  ): Promise<PayosPaymentLinkInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const { clientId, apiKey } = this.getCredentials();
    try {
      const response = await fetch(`${PAYOS_API_BASE_URL}/${payosOrderCode}`, {
        method: 'GET',
        headers: {
          'x-client-id': clientId,
          'x-api-key': apiKey,
        },
      });
      if (!response.ok) return null;

      const body = (await response.json().catch(() => null)) as {
        code?: string;
        data?: PayosPaymentLinkInfo | null;
      } | null;

      if (!body || body.code !== '00' || !body.data) {
        return null;
      }
      return body.data;
    } catch (err) {
      this.logger.warn(
        `Không thể kiểm tra trạng thái đơn ${payosOrderCode} từ payOS`,
        err,
      );
      return null;
    }
  }

  async cancelPaymentLink(
    payosOrderCode: number,
    cancellationReason = 'Học viên hủy đơn hàng',
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const { clientId, apiKey } = this.getCredentials();
    try {
      await fetch(`${PAYOS_API_BASE_URL}/${payosOrderCode}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ cancellationReason }),
      });
    } catch {
      // Bỏ qua lỗi hủy bên payOS nếu đơn đã hết hạn hoặc hủy trước đó
    }
  }
}
