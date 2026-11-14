<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { AlertCircle, Loader2 } from 'lucide-vue-next';
import {
  type DocxBlock,
  type DocxParagraphBlock,
  type DocxRun,
  parseDocxArrayBuffer,
} from '@/lib/docx-parser';
import { uploadsService } from '@/services/uploads.api';

const props = defineProps<{
  fileUrl: string;
  fileName?: string | null;
}>();

const emit = defineEmits<{
  loadedPlainText: [plainText: string];
}>();

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const docxBlocks = ref<DocxBlock[]>([]);
const rawTextContent = ref<string>('');
let activeObjectUrls: string[] = [];
let activeRequestId = 0;

const fileExtension = computed(() => {
  const source = (props.fileName || props.fileUrl || '').trim().toLowerCase();
  const clean = source.split('?')[0] ?? '';
  const dotIdx = clean.lastIndexOf('.');
  return dotIdx >= 0 ? clean.slice(dotIdx) : '';
});

const isPdf = computed(() => fileExtension.value === '.pdf');
const isDocx = computed(() => fileExtension.value === '.docx');
const isTextOrMarkdown = computed(
  () => fileExtension.value === '.txt' || fileExtension.value === '.md',
);

function cleanupObjectUrls() {
  for (const url of activeObjectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  activeObjectUrls = [];
}

function paragraphStyle(p: DocxParagraphBlock): Record<string, string> {
  const style: Record<string, string> = {
    textAlign: p.align,
    marginTop: `${p.spacingBeforePx}px`,
    marginBottom: `${p.spacingAfterPx}px`,
  };
  if (p.indentLeftPx > 0) {
    style.paddingLeft = `${p.indentLeftPx}px`;
  }
  if (p.firstLineIndentPx > 0) {
    style.textIndent = `${p.firstLineIndentPx}px`;
  }
  if (p.lineHeight) {
    style.lineHeight = String(p.lineHeight);
  }
  if (p.backgroundColor) {
    style.backgroundColor = p.backgroundColor;
    style.padding = '2px 6px';
  }
  return style;
}

function paragraphHeadingClass(p: DocxParagraphBlock): string {
  if (p.headingLevel === 1) return 'text-2xl font-bold text-ink';
  if (p.headingLevel === 2) return 'text-xl font-bold text-ink';
  if (p.headingLevel === 3) return 'text-lg font-semibold text-ink';
  if (p.headingLevel === 4) return 'text-base font-semibold text-ink';
  return 'text-sm sm:text-base text-ink leading-relaxed';
}

function runStyle(run: DocxRun): Record<string, string> {
  const style: Record<string, string> = {};
  if (run.fontSizePt && run.fontSizePt > 0) {
    style.fontSize = `${run.fontSizePt}pt`;
  }
  if (run.fontFamily) {
    style.fontFamily = `"${run.fontFamily}", sans-serif`;
  }
  if (run.color) {
    style.color = run.color;
  }
  if (run.backgroundColor) {
    style.backgroundColor = run.backgroundColor;
  }
  const decorations: string[] = [];
  if (run.underline) decorations.push('underline');
  if (run.strike) decorations.push('line-through');
  if (decorations.length > 0) {
    style.textDecoration = decorations.join(' ');
  }
  return style;
}

function runClass(run: DocxRun): string {
  const classes: string[] = ['whitespace-pre-wrap'];
  if (run.bold) classes.push('font-bold');
  if (run.italic) classes.push('italic');
  if (run.vertAlign === 'superscript') classes.push('align-super text-xs');
  if (run.vertAlign === 'subscript') classes.push('align-sub text-xs');
  return classes.join(' ');
}

async function loadDocumentContent() {
  const url = props.fileUrl?.trim();
  cleanupObjectUrls();
  docxBlocks.value = [];
  rawTextContent.value = '';
  errorMessage.value = null;

  if (!url || isPdf.value) {
    emit('loadedPlainText', '');
    return;
  }

  const reqId = ++activeRequestId;
  loading.value = true;

  try {
    const buffer = await uploadsService.fetchPublicDocumentBuffer(url);
    if (reqId !== activeRequestId) return;

    if (isDocx.value) {
      const parsed = await parseDocxArrayBuffer(buffer);
      if (reqId !== activeRequestId) {
        for (const objUrl of parsed.objectUrls) {
          URL.revokeObjectURL(objUrl);
        }
        return;
      }
      activeObjectUrls = parsed.objectUrls;
      docxBlocks.value = parsed.blocks;
      emit('loadedPlainText', parsed.plainText);
    } else if (isTextOrMarkdown.value) {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer).replace(/\r\n/g, '\n');
      rawTextContent.value = text;
      emit('loadedPlainText', text);
    }
  } catch {
    if (reqId !== activeRequestId) return;
    errorMessage.value =
      'Không thể hiển thị trực tiếp nội dung file tài liệu này. Bạn có thể bấm nút tải tài liệu ở bên dưới để xem trên máy.';
  } finally {
    if (reqId === activeRequestId) {
      loading.value = false;
    }
  }
}

watch(
  () => [props.fileUrl, props.fileName] as const,
  () => {
    void loadDocumentContent();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  activeRequestId += 1;
  cleanupObjectUrls();
});
</script>

<template>
  <div data-ui class="w-full">
    <!-- Trình đọc PDF nhúng trực tiếp -->
    <div
      v-if="isPdf"
      class="overflow-hidden border border-surface-3 bg-surface"
    >
      <iframe
        :src="fileUrl"
        title="Tài liệu PDF bài giảng"
        class="h-[680px] w-full"
      />
    </div>

    <!-- Trạng thái đang tải file .docx / .txt / .md -->
    <div
      v-else-if="loading"
      class="flex items-center gap-2.5 py-6 text-sm text-muted"
    >
      <Loader2 class="h-4 w-4 animate-spin text-brand-soft" />
      <span>Đang tải và hiển thị nội dung tài liệu...</span>
    </div>

    <!-- Lỗi khi đọc file -->
    <div
      v-else-if="errorMessage"
      class="flex items-center gap-2.5 bg-surface p-4 text-sm text-muted"
    >
      <AlertCircle class="h-4 w-4 shrink-0 text-brand-soft" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Hiển thị nguyên bản định dạng file Word (.docx) -->
    <div v-else-if="isDocx && docxBlocks.length > 0" class="docx-render">
      <template v-for="(block, bIndex) in docxBlocks" :key="bIndex">
        <!-- Đoạn văn (Paragraph) -->
        <template v-if="block.type === 'paragraph'">
          <div
            v-if="block.isEmpty"
            class="h-4 select-none"
            aria-hidden="true"
          />
          <p
            v-else
            :class="paragraphHeadingClass(block)"
            :style="paragraphStyle(block)"
          >
            <span
              v-if="block.listMarker"
              class="mr-2 inline-block select-none font-bold"
            >
              {{ block.listMarker }}
            </span>
            <template v-for="(run, rIndex) in block.runs" :key="rIndex">
              <br v-if="run.isBreak" />
              <span
                v-else-if="run.isTab"
                class="inline-block w-8"
                aria-hidden="true"
              />
              <img
                v-else-if="run.imageUrl"
                :src="run.imageUrl"
                :alt="run.imageAlt || 'Hình ảnh tài liệu'"
                class="my-2 inline-block max-w-full h-auto"
                :style="{
                  ...(run.imageWidthPx ? { width: `${run.imageWidthPx}px` } : {}),
                }"
              />
              <span
                v-else
                :class="runClass(run)"
                :style="runStyle(run)"
              >{{ run.text }}</span>
            </template>
          </p>
        </template>

        <!-- Bảng biểu (Table) -->
        <div
          v-else-if="block.type === 'table'"
          class="my-4 overflow-x-auto"
        >
          <table class="w-full border-collapse border border-surface-3 text-sm">
            <tbody>
              <tr
                v-for="(row, rowIdx) in block.rows"
                :key="rowIdx"
              >
                <td
                  v-for="(cell, cellIdx) in row.cells"
                  :key="cellIdx"
                  :colspan="cell.colSpan"
                  class="border border-surface-3 px-3 py-2 align-top"
                  :style="
                    cell.backgroundColor
                      ? { backgroundColor: cell.backgroundColor }
                      : undefined
                  "
                >
                  <template
                    v-for="(cp, cpIdx) in cell.paragraphs"
                    :key="cpIdx"
                  >
                    <div
                      v-if="cp.isEmpty"
                      class="h-3 select-none"
                      aria-hidden="true"
                    />
                    <p
                      v-else
                      :class="paragraphHeadingClass(cp)"
                      :style="paragraphStyle(cp)"
                    >
                      <span
                        v-if="cp.listMarker"
                        class="mr-2 inline-block select-none font-bold"
                      >
                        {{ cp.listMarker }}
                      </span>
                      <template
                        v-for="(run, rIdx) in cp.runs"
                        :key="rIdx"
                      >
                        <br v-if="run.isBreak" />
                        <span
                          v-else-if="run.isTab"
                          class="inline-block w-8"
                          aria-hidden="true"
                        />
                        <img
                          v-else-if="run.imageUrl"
                          :src="run.imageUrl"
                          :alt="run.imageAlt || 'Hình ảnh tài liệu'"
                          class="my-1.5 inline-block max-w-full h-auto"
                        />
                        <span
                          v-else
                          :class="runClass(run)"
                          :style="runStyle(run)"
                        >{{ run.text }}</span>
                      </template>
                    </p>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Hiển thị nguyên bản file .txt / .md -->
    <div
      v-else-if="isTextOrMarkdown && rawTextContent"
      class="whitespace-pre-wrap text-sm leading-relaxed text-ink sm:text-base"
    >{{ rawTextContent }}</div>
  </div>
</template>

