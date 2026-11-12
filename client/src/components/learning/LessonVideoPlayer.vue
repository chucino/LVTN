<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-vue-next';
import { formatCourseDuration } from '@/lib/course-format';

const props = defineProps<{
  lessonId: string;
  title: string;
  videoUrl: string;
  duration: number;
  lastPositionSec: number;
  watchedSeconds?: number;
  watchedFully: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'progress',
    payload: {
      lastPositionSec: number;
      watchedSeconds: number;
      watchedFully: boolean;
    },
  ): void;
}>();

const htmlVideoRef = ref<HTMLVideoElement | null>(null);
const ytContainerId = computed(() => `yt-player-${props.lessonId}`);
const currentPositionSec = ref(props.lastPositionSec || 0);
const accumulatedWatchedSec = ref(props.watchedSeconds || 0);
const isPlaying = ref(false);
const insufficientWatchWarning = ref(false);
const hasEmittedCompletion = ref(props.watchedFully);

let lastSavedPositionSec = props.lastPositionSec || 0;
let lastSavedWatchedSec = props.watchedSeconds || 0;
let ytPlayer: any = null;
let playTimer: ReturnType<typeof setInterval> | null = null;

const requiredWatchSec = computed(() =>
  props.duration > 0 ? Math.ceil(props.duration * 0.6) : 0,
);

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

function syncCurrentPositionFromPlayer(): void {
  if (isYouTube.value) {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      const sec = Math.floor(Number(ytPlayer.getCurrentTime() || 0));
      if (sec >= 0) currentPositionSec.value = sec;
    }
  } else if (htmlVideoRef.value) {
    const sec = Math.floor(htmlVideoRef.value.currentTime || 0);
    if (sec >= 0) currentPositionSec.value = sec;
  }
}

function stopPlayTimer(): void {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function startPlayTimer(): void {
  stopPlayTimer();
  playTimer = setInterval(() => {
    if (!isPlaying.value) return;

    syncCurrentPositionFromPlayer();

    const nextWatched = accumulatedWatchedSec.value + 1;
    accumulatedWatchedSec.value =
      props.duration > 0 ? Math.min(props.duration, nextWatched) : nextWatched;

    const reached60Percent =
      props.duration <= 0 ||
      accumulatedWatchedSec.value >= requiredWatchSec.value;

    if (reached60Percent && insufficientWatchWarning.value) {
      insufficientWatchWarning.value = false;
    }

    // Ngay khi bộ đếm chạm mốc 60% thời lượng bài giảng -> báo hoàn thành phần video ngay lập tức
    if (
      reached60Percent &&
      !props.watchedFully &&
      !hasEmittedCompletion.value
    ) {
      hasEmittedCompletion.value = true;
      lastSavedPositionSec = currentPositionSec.value;
      lastSavedWatchedSec = accumulatedWatchedSec.value;
      emit('progress', {
        lastPositionSec: currentPositionSec.value,
        watchedSeconds: accumulatedWatchedSec.value,
        watchedFully: true,
      });
      return;
    }

    // Định kỳ lưu cộng dồn mỗi 10 giây đang phát vào cơ sở dữ liệu
    if (
      accumulatedWatchedSec.value - lastSavedWatchedSec >= 10 ||
      Math.abs(currentPositionSec.value - lastSavedPositionSec) >= 15
    ) {
      lastSavedPositionSec = currentPositionSec.value;
      lastSavedWatchedSec = accumulatedWatchedSec.value;
      emit('progress', {
        lastPositionSec: currentPositionSec.value,
        watchedSeconds: accumulatedWatchedSec.value,
        watchedFully: props.watchedFully || reached60Percent,
      });
    }
  }, 1000);
}

function flushProgressOnPause(): void {
  syncCurrentPositionFromPlayer();
  const reached60Percent =
    props.watchedFully ||
    props.duration <= 0 ||
    accumulatedWatchedSec.value >= requiredWatchSec.value;

  if (reached60Percent) {
    hasEmittedCompletion.value = true;
    insufficientWatchWarning.value = false;
  }

  if (
    accumulatedWatchedSec.value !== lastSavedWatchedSec ||
    Math.abs(currentPositionSec.value - lastSavedPositionSec) >= 2
  ) {
    lastSavedPositionSec = currentPositionSec.value;
    lastSavedWatchedSec = accumulatedWatchedSec.value;
    emit('progress', {
      lastPositionSec: currentPositionSec.value,
      watchedSeconds: accumulatedWatchedSec.value,
      watchedFully: reached60Percent,
    });
  }
}

function handleVideoEnded(): void {
  syncCurrentPositionFromPlayer();
  const reached60Percent =
    props.watchedFully ||
    props.duration <= 0 ||
    accumulatedWatchedSec.value >= requiredWatchSec.value;

  lastSavedPositionSec = currentPositionSec.value;
  lastSavedWatchedSec = accumulatedWatchedSec.value;

  if (reached60Percent) {
    hasEmittedCompletion.value = true;
    insufficientWatchWarning.value = false;
    emit('progress', {
      lastPositionSec: currentPositionSec.value,
      watchedSeconds: accumulatedWatchedSec.value,
      watchedFully: true,
    });
  } else {
    insufficientWatchWarning.value = true;
    emit('progress', {
      lastPositionSec: currentPositionSec.value,
      watchedSeconds: accumulatedWatchedSec.value,
      watchedFully: false,
    });
  }
}

// HTML5 <video> handlers (cho phép học viên tua tự do)
function onHtmlLoadedMetadata(): void {
  const el = htmlVideoRef.value;
  if (!el) return;
  if (
    props.lastPositionSec > 0 &&
    (!el.duration || props.lastPositionSec < el.duration - 2)
  ) {
    el.currentTime = props.lastPositionSec;
  }
}

function onHtmlPlay(): void {
  isPlaying.value = true;
  startPlayTimer();
}

function onHtmlTimeUpdate(): void {
  const el = htmlVideoRef.value;
  if (!el) return;
  currentPositionSec.value = Math.max(0, Math.floor(el.currentTime));
}

function onHtmlPause(): void {
  isPlaying.value = false;
  stopPlayTimer();
  flushProgressOnPause();
}

function onHtmlEnded(): void {
  isPlaying.value = false;
  stopPlayTimer();
  handleVideoEnded();
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

function destroyYtPlayer(): void {
  stopPlayTimer();
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
          startPlayTimer();
        } else if (event.data === 2) {
          // YT.PlayerState.PAUSED === 2
          isPlaying.value = false;
          stopPlayTimer();
          flushProgressOnPause();
        } else if (event.data === 0) {
          // YT.PlayerState.ENDED === 0
          isPlaying.value = false;
          stopPlayTimer();
          handleVideoEnded();
        }
      },
    },
  });
}

watch(
  () => props.watchedSeconds,
  (newVal) => {
    if (typeof newVal === 'number' && newVal > accumulatedWatchedSec.value) {
      accumulatedWatchedSec.value = newVal;
      lastSavedWatchedSec = newVal;
    }
  },
);

watch(
  () => props.watchedFully,
  (completed) => {
    if (completed) {
      hasEmittedCompletion.value = true;
      insufficientWatchWarning.value = false;
    }
  },
);

watch(
  () => [props.lessonId, props.videoUrl],
  () => {
    isPlaying.value = false;
    stopPlayTimer();
    currentPositionSec.value = props.lastPositionSec || 0;
    accumulatedWatchedSec.value = props.watchedSeconds || 0;
    lastSavedPositionSec = props.lastPositionSec || 0;
    lastSavedWatchedSec = props.watchedSeconds || 0;
    hasEmittedCompletion.value = props.watchedFully;
    insufficientWatchWarning.value = false;

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
  if (isPlaying.value) {
    flushProgressOnPause();
  }
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
          @play="onHtmlPlay"
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
      </div>

      <div
        v-if="watchedFully"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#4fd1a5]/20 px-3 py-1 font-semibold text-[#4fd1a5]"
      >
        <CheckCircle2 class="h-3.5 w-3.5" />
        <span>Đã hoàn thành xem video bài giảng</span>
      </div>
      <div v-else class="text-white/65">
        Xem tối thiểu 60% thời lượng video để hệ thống ghi nhận hoàn thành video
      </div>
    </div>

    <div
      v-if="insufficientWatchWarning && !watchedFully"
      class="flex items-center gap-2.5 bg-amber-500/20 px-5 py-2.5 text-xs font-medium text-amber-200"
      role="alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0 text-amber-300" />
      <span>
        Bạn chưa xem đủ 60% thời lượng video bài giảng. Vui lòng tiếp tục phát video để đủ điều kiện mở khóa bài tiếp theo.
      </span>
    </div>
  </div>
</template>
