<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CheckCircle2, Clock } from 'lucide-vue-next';
import { formatCourseDuration } from '@/lib/course-format';

const props = defineProps<{
  lessonId: string;
  title: string;
  videoUrl: string;
  duration: number;
  lastPositionSec: number;
  watchedFully: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'progress',
    payload: { lastPositionSec: number; watchedFully: boolean },
  ): void;
}>();

const htmlVideoRef = ref<HTMLVideoElement | null>(null);
const ytContainerId = computed(() => `yt-player-${props.lessonId}`);
const currentPositionSec = ref(props.lastPositionSec || 0);
const maxWatchedSec = ref(props.lastPositionSec || 0);
const isPlaying = ref(false);

let lastSavedPositionSec = props.lastPositionSec || 0;
let ytPlayer: any = null;
let ytPollTimer: ReturnType<typeof setInterval> | null = null;

function extractYouTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const target = iframeSrcMatch?.[1] ?? trimmed;

  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = target.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

const youtubeVideoId = computed(() => extractYouTubeId(props.videoUrl));
const isYouTube = computed(() => Boolean(youtubeVideoId.value));

function maybeEmitPeriodicSave(sec: number): void {
  const rounded = Math.max(0, Math.floor(sec));
  currentPositionSec.value = rounded;
  if (rounded > maxWatchedSec.value) {
    maxWatchedSec.value = rounded;
  }
  if (Math.abs(rounded - lastSavedPositionSec) >= 10) {
    lastSavedPositionSec = rounded;
    emit('progress', {
      lastPositionSec: rounded,
      watchedFully: false,
    });
  }
}

function handleVideoEnded(finalDuration?: number): void {
  const finalSec = Math.max(
    props.duration,
    Math.floor(finalDuration || currentPositionSec.value || props.duration),
  );
  currentPositionSec.value = finalSec;
  maxWatchedSec.value = finalSec;
  lastSavedPositionSec = finalSec;
  emit('progress', {
    lastPositionSec: finalSec,
    watchedFully: true,
  });
}

// HTML5 <video> handlers
function onHtmlLoadedMetadata(): void {
  const el = htmlVideoRef.value;
  if (!el) return;
  if (props.lastPositionSec > 0 && (!el.duration || props.lastPositionSec < el.duration - 2)) {
    el.currentTime = props.lastPositionSec;
  }
}

function onHtmlTimeUpdate(): void {
  const el = htmlVideoRef.value;
  if (!el) return;
  // Không cho tua vượt quá vị trí đã xem xa nhất nếu bài học chưa xem hết
  if (!props.watchedFully && el.currentTime > maxWatchedSec.value + 4) {
    el.currentTime = maxWatchedSec.value;
    return;
  }
  maybeEmitPeriodicSave(el.currentTime);
}

function onHtmlPause(): void {
  isPlaying.value = false;
  const el = htmlVideoRef.value;
  if (!el) return;
  const sec = Math.max(0, Math.floor(el.currentTime));
  if (sec > 0 && sec !== lastSavedPositionSec) {
    lastSavedPositionSec = sec;
    emit('progress', {
      lastPositionSec: sec,
      watchedFully: false,
    });
  }
}

function onHtmlEnded(): void {
  isPlaying.value = false;
  const el = htmlVideoRef.value;
  handleVideoEnded(el?.duration);
}

// YouTube IFrame API loader & player
function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.YT && w.YT.Player) {
    return Promise.resolve(w.YT);
  }
  return new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    const prevCallback = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      resolve(w.YT);
    };
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

function clearYtPoll(): void {
  if (ytPollTimer) {
    clearInterval(ytPollTimer);
    ytPollTimer = null;
  }
}

function destroyYtPlayer(): void {
  clearYtPoll();
  if (ytPlayer && typeof ytPlayer.destroy === 'function') {
    try {
      ytPlayer.destroy();
    } catch {
      // ignore destroy errors
    }
  }
  ytPlayer = null;
}

async function initYouTubePlayer(): Promise<void> {
  destroyYtPlayer();
  const videoId = youtubeVideoId.value;
  if (!videoId) return;

  const YT = await loadYouTubeIframeApi();
  if (!YT || !YT.Player) return;

  ytPlayer = new YT.Player(ytContainerId.value, {
    videoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      start: props.lastPositionSec > 0 ? Math.floor(props.lastPositionSec) : 0,
    },
    events: {
      onStateChange: (event: any) => {
        // YT.PlayerState.PLAYING === 1
        if (event.data === 1) {
          isPlaying.value = true;
          clearYtPoll();
          ytPollTimer = setInterval(() => {
            if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
            const currentSec = Number(ytPlayer.getCurrentTime() || 0);
            if (!props.watchedFully && currentSec > maxWatchedSec.value + 6) {
              ytPlayer.seekTo(maxWatchedSec.value, true);
              return;
            }
            maybeEmitPeriodicSave(currentSec);
          }, 3000);
        } else if (event.data === 2) {
          // YT.PlayerState.PAUSED === 2
          isPlaying.value = false;
          clearYtPoll();
          if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
            const sec = Math.floor(Number(ytPlayer.getCurrentTime() || 0));
            if (sec > 0 && sec !== lastSavedPositionSec) {
              lastSavedPositionSec = sec;
              emit('progress', {
                lastPositionSec: sec,
                watchedFully: false,
              });
            }
          }
        } else if (event.data === 0) {
          // YT.PlayerState.ENDED === 0 -> Video đã phát hết 100% thời lượng!
          isPlaying.value = false;
          clearYtPoll();
          const totalDur =
            ytPlayer && typeof ytPlayer.getDuration === 'function'
              ? Number(ytPlayer.getDuration() || props.duration)
              : props.duration;
          handleVideoEnded(totalDur);
        }
      },
    },
  });
}

watch(
  () => [props.lessonId, props.videoUrl],
  () => {
    currentPositionSec.value = props.lastPositionSec || 0;
    maxWatchedSec.value = props.lastPositionSec || 0;
    lastSavedPositionSec = props.lastPositionSec || 0;
    if (isYouTube.value) {
      setTimeout(() => {
        void initYouTubePlayer();
      }, 50);
    } else {
      destroyYtPlayer();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (isYouTube.value) {
    void initYouTubePlayer();
  }
});

onBeforeUnmount(() => {
  destroyYtPlayer();
});
</script>

<template>
  <div class="overflow-hidden bg-navy">
    <div class="w-full bg-black">
      <div class="relative mx-auto aspect-video max-h-[calc(100svh-12.5rem)] w-full max-w-[1040px] bg-black">
        <div
          v-if="isYouTube"
          :id="ytContainerId"
          class="h-full w-full"
        />
        <video
          v-else
          ref="htmlVideoRef"
          :src="videoUrl"
          controls
          playsinline
          class="h-full w-full"
          @loadedmetadata="onHtmlLoadedMetadata"
          @play="isPlaying = true"
          @timeupdate="onHtmlTimeUpdate"
          @pause="onHtmlPause"
          @ended="onHtmlEnded"
        >
          Trình duyệt của bạn không hỗ trợ phát video trực tiếp.
        </video>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 bg-navy px-5 py-2.5 text-xs text-white/80">
      <div class="flex items-center gap-2">
        <Clock class="h-4 w-4 text-[#7dd3fc]" />
        <span class="tabular-nums">
          Thời lượng bài giảng: {{ formatCourseDuration(duration) }}
        </span>
        <span v-if="currentPositionSec > 0 && !watchedFully" class="text-white/60 tabular-nums">
          · Đang lưu ở {{ formatCourseDuration(currentPositionSec) }}
        </span>
      </div>

      <div
        v-if="watchedFully"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#4fd1a5]/20 px-3 py-1 font-semibold text-[#4fd1a5]"
      >
        <CheckCircle2 class="h-3.5 w-3.5" />
        <span>Đã xem hết 100% video bài giảng</span>
      </div>
      <div v-else class="text-white/65">
        Xem hết 100% thời lượng video để hệ thống tự động ghi nhận hoàn thành video
      </div>
    </div>
  </div>
</template>

