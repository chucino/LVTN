<script setup lang="ts">
import { computed, ref } from 'vue';
import { Award, Check, Copy, Download, ExternalLink, ShieldCheck } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    certificateCode: string;
    studentName: string;
    courseTitle: string;
    instructorName: string;
    issuedAt: string;
    isValid?: boolean;
    hideActions?: boolean;
  }>(),
  {
    isValid: true,
    hideActions: false,
  },
);

const copied = ref(false);
const exportingPdf = ref(false);
const sealLoadError = ref(false);

const formattedDate = computed(() => {
  const d = new Date(props.issuedAt);
  if (Number.isNaN(d.getTime())) return props.issuedAt;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

const verifyUrl = computed(() => {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://nextcode.vn';
  return `${origin}/certificates/verify/${encodeURIComponent(props.certificateCode)}`;
});

async function copyVerifyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(verifyUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2200);
  } catch {
    copied.value = false;
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let currentLine = words[0] ?? '';

  for (let i = 1; i < words.length; i += 1) {
    const word = words[i] ?? '';
    const candidate = `${currentLine} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Đóng gói mảng byte ảnh JPEG thành file PDF 1.4 chuẩn khổ Ngang
 * (/MediaBox [0 0 841.89 pageHeightPt], /Rotate 0) khớp đúng tỷ lệ khung chứng chỉ trên web.
 */
function buildLandscapeA4PdfFromJpeg(
  jpegBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number,
): Blob {
  const pageWidthPt = 841.89;
  const pageHeightPt = Number(((pageWidthPt * pixelHeight) / pixelWidth).toFixed(2));
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let totalBytes = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    totalBytes += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    totalBytes += bytes.length;
  };

  // PDF 1.4 Header
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = totalBytes;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets[2] = totalBytes;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page (Landscape: 841.89pt x pageHeightPt, Rotate 0)
  offsets[3] = totalBytes;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Rotate 0 /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );

  // Object 4: JPEG XObject
  offsets[4] = totalBytes;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // Object 5: Content stream drawing the image across the full Landscape page
  const contentStream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = totalBytes;
  pushStr(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
  );

  // Xref table
  const xrefOffset = totalBytes;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i += 1) {
    const off = String(offsets[i] ?? 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  const output = new Uint8Array(totalBytes);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }

  return new Blob([output], { type: 'application/pdf' });
}

/**
 * Kết xuất trực tiếp chứng chỉ ra file PDF 1 trang khổ Ngang (Landscape) độ phân giải 300 DPI,
 * tính toán chiều cao động ôm khít nội dung để không có khoảng trắng thừa dưới tên khóa học.
 */
async function downloadCertificatePdf(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || exportingPdf.value) {
    return;
  }

  exportingPdf.value = true;
  try {
    const W = 2480;
    const outerX = 64;
    const outerY = 64;
    const outerW = W - outerX * 2;
    const innerX = outerX + 46;
    const innerY = outerY + 48;
    const innerW = outerW - 92;
    const padX = innerX + 92;
    const rightX = innerX + innerW - 92;
    const fontStack = "'Inter', 'Segoe UI', Roboto, Arial, sans-serif";

    // Bước 1: Đo trước số dòng của tên khóa học để tính chính xác chiều cao khung chứng chỉ (ôm sát như trên web)
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) return;
    measureCtx.font = `800 44px ${fontStack}`;
    const quotedCourse = `“${props.courseTitle}”`;
    const courseLines = wrapCanvasText(measureCtx, quotedCourse, innerW - 360).slice(0, 2);
    const maxLineW = Math.max(...courseLines.map((l) => measureCtx.measureText(l).width));
    const boxW = Math.min(innerW - 220, Math.max(540, maxLineW + 140));
    const boxH = courseLines.length === 1 ? 100 : 148;

    // Tính tọa độ dọc từng phần đồng bộ tỷ lệ với giao diện web
    const headerTop = innerY + 72;
    const logoBoxSize = 108;
    const headerDividerY = headerTop + logoBoxSize + 40;

    const eyebrowY = headerDividerY + 86;
    const mainTitleY = eyebrowY + 80;
    const presentY = mainTitleY + 62;
    const studentY = presentY + 98;
    const nameLineY = studentY + 32;
    const descY = nameLineY + 56;
    const boxY = descY + 76;

    // Đường kẻ chân chứng chỉ nằm ngay dưới hộp tên khóa học 84px (đối xứng với khoảng cách trên, không còn khoảng trắng lớn)
    const footerDividerY = boxY + boxH + 84;
    const footerContentHeight = 258;
    const innerH = footerDividerY + footerContentHeight - innerY;
    const outerH = innerH + 96;
    const H = outerY + outerH + 64;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [logoImg, sealImg] = await Promise.all([
      loadImage('/logo.jpg'),
      loadImage('/con_dau.jpg'),
    ]);

    // 1. Nền giấy trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Khung ngoài chứng chỉ (#0b1f4d)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(outerX, outerY, outerW, outerH);

    // Thanh màu thương hiệu trên & dưới
    const topGrad = ctx.createLinearGradient(outerX, 0, outerX + outerW, 0);
    topGrad.addColorStop(0, '#0b1f4d');
    topGrad.addColorStop(0.55, '#1d4ed8');
    topGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = topGrad;
    ctx.fillRect(outerX, outerY, outerW, 22);

    const botGrad = ctx.createLinearGradient(outerX, 0, outerX + outerW, 0);
    botGrad.addColorStop(0, '#0284c7');
    botGrad.addColorStop(0.45, '#1d4ed8');
    botGrad.addColorStop(1, '#0b1f4d');
    ctx.fillStyle = botGrad;
    ctx.fillRect(outerX, outerY + outerH - 16, outerW, 16);

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0b1f4d';
    ctx.strokeRect(outerX, outerY, outerW, outerH);

    // 3. Khung trắng bên trong
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(innerX, innerY, innerW, innerH);

    // 4 góc kỷ hà hiện đại (#1d4ed8)
    const cornerOffset = 24;
    const cornerLen = 58;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(innerX + cornerOffset, innerY + cornerOffset + cornerLen);
    ctx.lineTo(innerX + cornerOffset, innerY + cornerOffset);
    ctx.lineTo(innerX + cornerOffset + cornerLen, innerY + cornerOffset);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(innerX + innerW - cornerOffset - cornerLen, innerY + cornerOffset);
    ctx.lineTo(innerX + innerW - cornerOffset, innerY + cornerOffset);
    ctx.lineTo(innerX + innerW - cornerOffset, innerY + cornerOffset + cornerLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(innerX + cornerOffset, innerY + innerH - cornerOffset - cornerLen);
    ctx.lineTo(innerX + cornerOffset, innerY + innerH - cornerOffset);
    ctx.lineTo(innerX + cornerOffset + cornerLen, innerY + innerH - cornerOffset);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(innerX + innerW - cornerOffset - cornerLen, innerY + innerH - cornerOffset);
    ctx.lineTo(innerX + innerW - cornerOffset, innerY + innerH - cornerOffset);
    ctx.lineTo(innerX + innerW - cornerOffset, innerY + innerH - cornerOffset - cornerLen);
    ctx.stroke();

    // 5. Header chứng chỉ
    drawRoundedRect(ctx, padX, headerTop, logoBoxSize, logoBoxSize, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    if (logoImg) {
      ctx.drawImage(logoImg, padX + 12, headerTop + 12, logoBoxSize - 24, logoBoxSize - 24);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0b1f4d';
    ctx.font = `800 40px ${fontStack}`;
    ctx.fillText('NEXTCODE CENTER', padX + logoBoxSize + 28, headerTop + 48);

    ctx.fillStyle = '#64748b';
    ctx.font = `600 21px ${fontStack}`;
    ctx.fillText(
      'NỀN TẢNG ĐÀO TẠO LẬP TRÌNH & CÔNG NGHỆ TRỰC TUYẾN',
      padX + logoBoxSize + 28,
      headerTop + 84,
    );

    // Badge trạng thái góc phải
    const statusText = props.isValid ? 'CHỨNG CHỈ ĐÃ XÁC THỰC' : 'CHỨNG CHỈ ĐÃ THU HỒI';
    ctx.font = `800 22px ${fontStack}`;
    const badgeTextW = ctx.measureText(statusText).width;
    const badgeW = badgeTextW + 78;
    const badgeH = 58;
    const badgeX = rightX - badgeW;
    const badgeY = headerTop + 24;

    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 29);
    ctx.fillStyle = props.isValid ? '#ecfdf5' : '#fff1f2';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = props.isValid ? '#10b981' : '#f43f5e';
    ctx.stroke();

    ctx.fillStyle = props.isValid ? '#047857' : '#be123c';
    ctx.textAlign = 'center';
    ctx.fillText(`✓  ${statusText}`, badgeX + badgeW / 2, badgeY + 37);

    // Đường kẻ ngang phân tách Header
    ctx.beginPath();
    ctx.moveTo(padX, headerDividerY);
    ctx.lineTo(rightX, headerDividerY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // 6. Nội dung trung tâm chứng chỉ
    const centerX = W / 2;

    // Eyebrow: CERTIFICATE OF COMPLETION
    ctx.font = `800 25px ${fontStack}`;
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'center';
    const eyebrowLabel = 'CERTIFICATE OF COMPLETION';
    ctx.fillText(eyebrowLabel, centerX, eyebrowY);

    const eyebrowHalfW = ctx.measureText(eyebrowLabel).width / 2 + 32;
    ctx.beginPath();
    ctx.moveTo(centerX - eyebrowHalfW - 125, eyebrowY - 8);
    ctx.lineTo(centerX - eyebrowHalfW, eyebrowY - 8);
    ctx.moveTo(centerX + eyebrowHalfW, eyebrowY - 8);
    ctx.lineTo(centerX + eyebrowHalfW + 125, eyebrowY - 8);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d4ed8';
    ctx.stroke();

    // Tiêu đề chính
    ctx.font = `900 66px ${fontStack}`;
    ctx.fillStyle = '#0b1f4d';
    ctx.fillText('CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC', centerX, mainTitleY);

    // Dòng dẫn
    ctx.font = `500 27px ${fontStack}`;
    ctx.fillStyle = '#64748b';
    ctx.fillText('Trung tâm Đào tạo NextCode Center trân trọng chứng nhận học viên', centerX, presentY);

    // Tên học viên
    ctx.font = `900 86px ${fontStack}`;
    ctx.fillStyle = '#0b1f4d';
    ctx.fillText(props.studentName, centerX, studentY);

    // Đường kẻ gradient dưới tên học viên
    const nameLineGrad = ctx.createLinearGradient(centerX - 320, 0, centerX + 320, 0);
    nameLineGrad.addColorStop(0, 'rgba(29,78,216,0)');
    nameLineGrad.addColorStop(0.5, '#1d4ed8');
    nameLineGrad.addColorStop(1, 'rgba(29,78,216,0)');
    ctx.fillStyle = nameLineGrad;
    ctx.fillRect(centerX - 320, nameLineY, 640, 4);

    // Đoạn văn mô tả
    ctx.font = `400 27px ${fontStack}`;
    ctx.fillStyle = '#475569';
    ctx.fillText(
      'Đã hoàn thành xuất sắc 100% chương trình bài giảng và vượt qua toàn bộ bài kiểm tra đánh giá',
      centerX,
      descY,
    );
    ctx.fillText(
      'năng lực theo tiêu chuẩn đào tạo của khóa học:',
      centerX,
      descY + 42,
    );

    // Hộp tên khóa học
    const boxX = centerX - boxW / 2;
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#bfdbfe';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Cạnh trái & phải đậm (#1d4ed8)
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(boxX, boxY, 8, boxH);
    ctx.fillRect(boxX + boxW - 8, boxY, 8, boxH);

    ctx.font = `800 44px ${fontStack}`;
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    if (courseLines.length === 1) {
      ctx.fillText(courseLines[0] ?? '', centerX, boxY + 65);
    } else {
      ctx.fillText(courseLines[0] ?? '', centerX, boxY + 58);
      ctx.fillText(courseLines[1] ?? '', centerX, boxY + 112);
    }

    // 7. Chân chứng chỉ (Nằm ngay dưới hộp tên khóa học, không còn khoảng trắng thừa)
    ctx.beginPath();
    ctx.moveTo(padX, footerDividerY);
    ctx.lineTo(rightX, footerDividerY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Cột trái: Giảng viên hướng dẫn
    const leftColY = footerDividerY + 78;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 21px ${fontStack}`;
    ctx.fillText('GIẢNG VIÊN HƯỚNG DẪN', padX, leftColY);

    ctx.fillStyle = '#0b1f4d';
    ctx.font = `800 35px ${fontStack}`;
    ctx.fillText(props.instructorName, padX, leftColY + 48);

    ctx.fillStyle = '#64748b';
    ctx.font = `500 22px ${fontStack}`;
    ctx.fillText('Giảng viên chuyên môn · NextCode Center', padX, leftColY + 86);

    // Cột giữa: Ảnh con dấu con_dau.jpg + chữ NEXTCODE
    const sealSize = 158;
    const sealY = footerDividerY + 28;
    if (sealImg) {
      ctx.drawImage(sealImg, centerX - sealSize / 2, sealY, sealSize, sealSize);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b1f4d';
    ctx.font = `800 22px ${fontStack}`;
    ctx.fillText('NEXTCODE', centerX, sealY + sealSize + 30);

    // Cột phải: Ngày cấp chứng chỉ & Mã số xác thực
    const rightTopY = footerDividerY + 50;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 20px ${fontStack}`;
    ctx.fillText('NGÀY CẤP CHỨNG CHỈ', rightX, rightTopY);

    ctx.fillStyle = '#0b1f4d';
    ctx.font = `800 32px ${fontStack}`;
    ctx.fillText(formattedDate.value, rightX, rightTopY + 42);

    // Đường kẻ nhỏ bên phải
    ctx.beginPath();
    ctx.moveTo(rightX - 360, rightTopY + 62);
    ctx.lineTo(rightX, rightTopY + 62);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `600 20px ${fontStack}`;
    ctx.fillText('MÃ SỐ XÁC THỰC', rightX, rightTopY + 98);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = `800 29px ${fontStack}`;
    ctx.fillText(props.certificateCode, rightX, rightTopY + 136);

    ctx.fillStyle = '#64748b';
    ctx.font = `500 20px ${fontStack}`;
    ctx.fillText('Cấp bởi Hệ thống Đào tạo NextCode Center', rightX, rightTopY + 170);

    // 8. Chuyển Canvas sang JPEG bytes và đóng gói thành PDF A4 Landscape
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const base64Data = dataUrl.split(',')[1] ?? '';
    const binaryStr = window.atob(base64Data);
    const jpegBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      jpegBytes[i] = binaryStr.charCodeAt(i);
    }

    const pdfBlob = buildLandscapeA4PdfFromJpeg(jpegBytes, W, H);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Chung-chi-${props.certificateCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } finally {
    exportingPdf.value = false;
  }
}
</script>

<template>
  <div data-ui class="space-y-4">
    <!-- Thanh thao tác -->
    <div
      v-if="!hideActions"
      class="print-hidden flex flex-wrap items-center justify-between gap-3 bg-surface p-4"
    >
      <div class="flex items-center gap-2.5 text-sm font-medium text-teal">
        <ShieldCheck class="h-5 w-5 shrink-0" />
        <span>
          Chứng chỉ điện tử hợp lệ · Mã số:
          <strong class="tabular-nums">{{ certificateCode }}</strong>
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="manage-button-secondary text-xs"
          @click="copyVerifyLink"
        >
          <Check v-if="copied" class="h-4 w-4 text-teal" />
          <Copy v-else class="h-4 w-4" />
          <span>{{ copied ? 'Đã sao chép liên kết' : 'Sao chép link xác thực' }}</span>
        </button>
        <router-link
          :to="{ name: 'CertificateVerifyCode', params: { code: certificateCode } }"
          class="manage-button-secondary text-xs"
        >
          <ExternalLink class="h-4 w-4" />
          <span>Trang tra cứu</span>
        </router-link>
        <button
          type="button"
          class="manage-button-primary text-xs"
          :disabled="exportingPdf"
          @click="downloadCertificatePdf"
        >
          <Download class="h-4 w-4" />
          <span>{{ exportingPdf ? 'Đang tạo PDF...' : 'Tải PDF' }}</span>
        </button>
      </div>
    </div>

    <!-- Bản vẽ Chứng chỉ (Phong cách Công nghệ Hiện đại - NextCode Center) -->
    <article
      class="certificate-sheet relative overflow-hidden border-2 border-[#0b1f4d] bg-[#f8fafc] p-3 text-[#0b1f4d] shadow-md sm:p-6"
      aria-label="Chứng chỉ hoàn thành khóa học NextCode Center"
    >
      <!-- Thanh màu thương hiệu trên & dưới -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#0b1f4d] via-[#1d4ed8] to-[#0284c7]"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#0284c7] via-[#1d4ed8] to-[#0b1f4d]"
      />

      <!-- Khung viền kỷ hà bên trong -->
      <div class="relative border border-slate-300 bg-white px-5 py-7 sm:px-12 sm:py-10">
        <!-- 4 góc kỷ hà hiện đại -->
        <span
          class="pointer-events-none absolute left-2.5 top-2.5 h-6 w-6 border-l-2 border-t-2 border-[#1d4ed8]"
        />
        <span
          class="pointer-events-none absolute right-2.5 top-2.5 h-6 w-6 border-r-2 border-t-2 border-[#1d4ed8]"
        />
        <span
          class="pointer-events-none absolute bottom-2.5 left-2.5 h-6 w-6 border-b-2 border-l-2 border-[#1d4ed8]"
        />
        <span
          class="pointer-events-none absolute bottom-2.5 right-2.5 h-6 w-6 border-b-2 border-r-2 border-[#1d4ed8]"
        />

        <!-- Header chứng chỉ -->
        <div
          class="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-3.5">
            <img
              src="/logo.jpg"
              alt="Logo NextCode Center"
              width="52"
              height="52"
              class="h-12 w-12 rounded-lg border border-slate-300 bg-white object-contain p-1"
            />
            <div>
              <p class="text-lg font-extrabold tracking-wider text-[#0b1f4d] sm:text-xl">
                NEXTCODE CENTER
              </p>
              <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Nền tảng đào tạo lập trình &amp; công nghệ trực tuyến
              </p>
            </div>
          </div>

          <div class="flex flex-col items-start sm:items-end">
            <div
              class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold tracking-wide"
              :class="
                isValid
                  ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                  : 'border-rose-500/40 bg-rose-50 text-rose-700'
              "
            >
              <Award class="h-3.5 w-3.5" />
              <span>{{ isValid ? 'CHỨNG CHỈ ĐÃ XÁC THỰC' : 'CHỨNG CHỈ ĐÃ THU HỒI' }}</span>
            </div>
          </div>
        </div>

        <!-- Nội dung chính -->
        <div class="my-8 text-center sm:my-10">
          <div class="flex items-center justify-center gap-3">
            <span class="h-[1.5px] w-10 bg-[#1d4ed8] sm:w-16" />
            <p
              class="text-xs font-extrabold uppercase tracking-[0.24em] text-[#1d4ed8] sm:text-sm"
            >
              Certificate of Completion
            </p>
            <span class="h-[1.5px] w-10 bg-[#1d4ed8] sm:w-16" />
          </div>

          <h2
            class="mt-3 text-2xl font-black uppercase tracking-tight text-[#0b1f4d] sm:text-4xl"
          >
            Chứng chỉ hoàn thành khóa học
          </h2>

          <p class="mt-4 text-xs font-medium text-slate-500 sm:text-sm">
            Trung tâm Đào tạo NextCode Center trân trọng chứng nhận học viên
          </p>

          <p
            class="mt-2.5 text-3xl font-black tracking-tight text-[#0b1f4d] sm:text-5xl"
          >
            {{ studentName }}
          </p>

          <div
            class="mx-auto mt-3 h-[2px] w-48 bg-gradient-to-r from-transparent via-[#1d4ed8] to-transparent sm:w-72"
          />

          <p
            class="mx-auto mt-5 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm"
          >
            Đã hoàn thành xuất sắc 100% chương trình bài giảng và vượt qua toàn bộ bài kiểm tra
            đánh giá năng lực theo tiêu chuẩn đào tạo của khóa học:
          </p>

          <div
            class="mt-4 inline-block border border-blue-200 border-x-4 border-x-[#1d4ed8] bg-blue-50/80 px-6 py-2.5 sm:px-9 sm:py-3"
          >
            <h3 class="text-lg font-extrabold text-[#1e3a8a] sm:text-2xl">
              “{{ courseTitle }}”
            </h3>
          </div>
        </div>

        <!-- Chân chứng chỉ: Giảng viên hướng dẫn - Con dấu NEXTCODE - Thông tin cấp phát -->
        <div
          class="mt-8 grid items-center gap-6 border-t border-slate-200 pt-6 sm:grid-cols-3"
        >
          <!-- Cột trái: Giảng viên hướng dẫn -->
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Giảng viên hướng dẫn
            </p>
            <p class="mt-1 text-base font-extrabold text-[#0b1f4d]">
              {{ instructorName }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              Giảng viên chuyên môn · NextCode Center
            </p>
          </div>

          <!-- Cột giữa: Ảnh con dấu chứng nhận con_dau.jpg -->
          <div class="flex flex-col items-center justify-center">
            <img
              v-if="!sealLoadError"
              src="/con_dau.jpg"
              alt="Con dấu xác thực NextCode Center"
              width="96"
              height="96"
              class="h-24 w-24 object-contain"
              @error="sealLoadError = true"
            />
            <ShieldCheck v-else class="h-20 w-20 text-[#0b1f4d]" />
            <p
              class="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#0b1f4d]"
            >
              NEXTCODE
            </p>
          </div>

          <!-- Cột phải: Ngày cấp & Mã số xác thực -->
          <div class="sm:text-right">
            <div class="mb-2">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ngày cấp chứng chỉ
              </p>
              <p class="mt-0.5 text-base font-extrabold tabular-nums text-[#0b1f4d]">
                {{ formattedDate }}
              </p>
            </div>
            <div class="mb-2 h-px w-48 bg-slate-300 sm:ml-auto" />
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Mã số xác thực
            </p>
            <p class="mt-0.5 text-sm font-extrabold tabular-nums text-[#1d4ed8]">
              {{ certificateCode }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              Cấp bởi Hệ thống Đào tạo NextCode Center
            </p>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }
  .print-hidden {
    display: none !important;
  }
  .certificate-sheet {
    page-break-inside: avoid;
    break-inside: avoid;
    box-shadow: none !important;
  }
}
</style>
