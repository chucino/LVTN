export function formatCoursePrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function formatCourseDuration(durationInSeconds: number): string {
  if (durationInSeconds <= 0) return '0 phút';

  const totalMinutes = Math.floor(durationInSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

export function getCourseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'status' in response) {
      if (response.status === 404) return 'Không tìm thấy khóa học này.';
    }
  }
  return 'Không thể tải dữ liệu khóa học. Vui lòng thử lại.';
}
