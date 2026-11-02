const YOUTUBE_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

export const LOCAL_VIDEO_PATH_REGEX =
  /^\/public\/videos\/[a-zA-Z0-9_-]+\.(?:mp4|webm)$/i;

export interface ParsedYouTubeEmbed {
  videoId: string;
  embedUrl: string;
  canonicalIframe: string;
}

export function buildCanonicalYouTubeIframe(videoId: string): string {
  return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}

export function parseYouTubeEmbedInput(raw: string): ParsedYouTubeEmbed | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidateUrl = trimmed;
  if (/^<iframe\b/i.test(trimmed)) {
    if (!/^<iframe\b[^>]*>\s*<\/iframe>$/i.test(trimmed)) {
      return null;
    }
    const srcMatch = trimmed.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    candidateUrl = (srcMatch?.[1] ?? srcMatch?.[2] ?? '').trim();
    if (!candidateUrl) return null;
  }

  try {
    const parsed = new URL(candidateUrl);
    if (
      parsed.protocol !== 'https:' ||
      !YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())
    ) {
      return null;
    }
    const embedMatch = parsed.pathname.match(
      /^\/embed\/([a-zA-Z0-9_-]{11})(?:\/)?$/,
    );
    const videoId = embedMatch?.[1];
    if (!videoId) return null;

    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      canonicalIframe: buildCanonicalYouTubeIframe(videoId),
    };
  } catch {
    return null;
  }
}

export function isLocalVideoUrl(raw: string): boolean {
  return LOCAL_VIDEO_PATH_REGEX.test(raw.trim());
}

export interface YouTubePlayerInstance {
  getDuration(): number;
  destroy(): void;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void;
        onError?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API chỉ chạy trên trình duyệt'));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error('Không thể khởi tạo YouTube IFrame API'));
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        youtubeApiPromise = null;
        reject(new Error('Không thể tải script YouTube IFrame API'));
      };
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

