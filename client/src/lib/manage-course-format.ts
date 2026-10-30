export function secondsToParts(seconds: number): { minutes: number; seconds: number } {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return {
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60,
  };
}

export function partsToSeconds(minutes: number, seconds: number): number {
  return Math.max(0, Math.floor(minutes)) * 60 + Math.max(0, Math.floor(seconds));
}

export function getManageErrorMessage(
  error: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.',
): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return fallback;
  }

  const data = response.data;
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = data.message;
    const messageText =
      typeof message === 'string'
        ? message
        : Array.isArray(message)
          ? message.filter((item) => typeof item === 'string').join(' ')
          : '';
    const issues =
      'issues' in data && Array.isArray(data.issues)
        ? data.issues.filter((item): item is string => typeof item === 'string')
        : [];
    return [messageText, ...issues].filter(Boolean).join(' ') || fallback;
  }

  return fallback;
}
