export interface DocxRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  vertAlign?: 'superscript' | 'subscript' | null;
  fontSizePt?: number | null;
  fontFamily?: string | null;
  color?: string | null;
  backgroundColor?: string | null;
  isBreak?: boolean;
  isTab?: boolean;
  imageUrl?: string | null;
  imageAlt?: string;
  imageWidthPx?: number | null;
  imageHeightPx?: number | null;
}

export interface DocxParagraphBlock {
  type: 'paragraph';
  align: 'left' | 'center' | 'right' | 'justify';
  headingLevel: 1 | 2 | 3 | 4 | null;
  listMarker: string | null;
  indentLeftPx: number;
  firstLineIndentPx: number;
  spacingBeforePx: number;
  spacingAfterPx: number;
  lineHeight: number | null;
  backgroundColor: string | null;
  isEmpty: boolean;
  runs: DocxRun[];
}

export interface DocxTableCell {
  colSpan: number;
  backgroundColor: string | null;
  paragraphs: DocxParagraphBlock[];
}

export interface DocxTableRow {
  cells: DocxTableCell[];
}

export interface DocxTableBlock {
  type: 'table';
  rows: DocxTableRow[];
}

export type DocxBlock = DocxParagraphBlock | DocxTableBlock;

export interface ParsedDocxDocument {
  blocks: DocxBlock[];
  plainText: string;
  objectUrls: string[];
}

interface ZipEntryMeta {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

interface StyleDef {
  basedOn?: string;
  headingLevel?: 1 | 2 | 3 | 4 | null;
  align?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  fontSizePt?: number | null;
  fontFamily?: string | null;
  color?: string | null;
  spacingBeforePx?: number;
  spacingAfterPx?: number;
  lineHeight?: number | null;
}

const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  cyan: '#a5f3fc',
  magenta: '#f5d0fe',
  blue: '#bfdbfe',
  red: '#fecaca',
  darkBlue: '#1e3a8a',
  darkCyan: '#155e75',
  darkGreen: '#166534',
  darkMagenta: '#86198f',
  darkRed: '#991b1b',
  darkYellow: '#854d0e',
  darkGray: '#9ca3af',
  lightGray: '#e5e7eb',
};

function twipsToPx(twips: number): number {
  // 1 pt = 20 twips, 1 pt = 4/3 px => 1 twip = 1/15 px
  return Math.round((twips / 15) * 10) / 10;
}

function emuToPx(emu: number): number {
  // 914400 EMUs = 1 inch = 96 px => 1 px = 9525 EMUs
  return Math.round(emu / 9525);
}

function normalizeHexColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^#/, '');
  if (cleaned.toLowerCase() === 'auto' || cleaned.length === 0) return null;
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned}`;
  }
  return null;
}

function getLocalAttr(el: Element, localName: string): string | null {
  return (
    el.getAttribute(`w:${localName}`) ??
    el.getAttribute(`r:${localName}`) ??
    el.getAttribute(localName)
  );
}

function findDirectChild(parent: Element, localName: string): Element | null {
  for (let i = 0; i < parent.children.length; i += 1) {
    const child = parent.children[i];
    if (child && child.localName === localName) {
      return child;
    }
  }
  return null;
}

function findDirectChildren(parent: Element, localName: string): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < parent.children.length; i += 1) {
    const child = parent.children[i];
    if (child && child.localName === localName) {
      result.push(child);
    }
  }
  return result;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const safeCopy = new Uint8Array(compressed.byteLength);
  safeCopy.set(compressed);
  void writer.write(safeCopy);
  void writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLength += value.byteLength;
    }
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function parseZipDirectory(buffer: ArrayBuffer): ZipEntryMeta[] {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntryMeta[] = [];

  // Tìm End of Central Directory (0x06054b50) từ cuối file ngược lên
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minEocdSearch; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset >= 0) {
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);

    for (let idx = 0; idx < totalEntries; idx += 1) {
      if (cdOffset + 46 > bytes.length) break;
      if (view.getUint32(cdOffset, true) !== 0x02014b50) break;

      const compressionMethod = view.getUint16(cdOffset + 10, true);
      const compressedSize = view.getUint32(cdOffset + 20, true);
      const uncompressedSize = view.getUint32(cdOffset + 24, true);
      const fileNameLength = view.getUint16(cdOffset + 28, true);
      const extraFieldLength = view.getUint16(cdOffset + 30, true);
      const commentLength = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const nameStart = cdOffset + 46;
      const nameEnd = nameStart + fileNameLength;
      if (nameEnd > bytes.length) break;

      const name = decoder.decode(bytes.subarray(nameStart, nameEnd));
      entries.push({
        name,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      });

      cdOffset = nameEnd + extraFieldLength + commentLength;
    }
    if (entries.length > 0) {
      return entries;
    }
  }

  // Fallback quét Local File Header (0x04034b50)
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) break;

    const name = decoder.decode(bytes.subarray(nameStart, nameEnd));
    entries.push({
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset: offset,
    });

    const dataStart = nameEnd + extraFieldLength;
    offset = compressedSize > 0 ? dataStart + compressedSize : dataStart + 1;
  }

  return entries;
}

async function extractZipEntryBytes(
  buffer: ArrayBuffer,
  entry: ZipEntryMeta,
): Promise<Uint8Array | null> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const offset = entry.localHeaderOffset;

  if (offset + 30 > bytes.length) return null;
  if (view.getUint32(offset, true) !== 0x04034b50) return null;

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraFieldLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraFieldLength;
  const dataEnd =
    entry.compressedSize > 0
      ? Math.min(bytes.length, dataStart + entry.compressedSize)
      : bytes.length;

  if (dataStart > dataEnd) return null;
  const slice = bytes.subarray(dataStart, dataEnd);

  if (entry.compressionMethod === 0) {
    return slice;
  }
  if (entry.compressionMethod === 8) {
    try {
      return await inflateRawBytes(slice);
    } catch {
      return null;
    }
  }
  return null;
}

function parseStylesXml(xmlText: string): Map<string, StyleDef> {
  const map = new Map<string, StyleDef>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const styleEls = Array.from(doc.getElementsByTagName('*')).filter(
    (el) => el.localName === 'style',
  );

  for (const styleEl of styleEls) {
    const styleId = getLocalAttr(styleEl, 'styleId');
    if (!styleId) continue;

    const def: StyleDef = {};
    const nameEl = findDirectChild(styleEl, 'name');
    const styleName = (getLocalAttr(nameEl ?? styleEl, 'val') ?? styleId).toLowerCase();

    if (styleName.startsWith('heading 1') || styleId.toLowerCase() === 'heading1') {
      def.headingLevel = 1;
    } else if (
      styleName.startsWith('heading 2') ||
      styleId.toLowerCase() === 'heading2'
    ) {
      def.headingLevel = 2;
    } else if (
      styleName.startsWith('heading 3') ||
      styleId.toLowerCase() === 'heading3'
    ) {
      def.headingLevel = 3;
    } else if (
      styleName.startsWith('heading 4') ||
      styleId.toLowerCase() === 'heading4' ||
      styleName === 'title'
    ) {
      def.headingLevel = styleName === 'title' ? 1 : 4;
    }

    const basedOnEl = findDirectChild(styleEl, 'basedOn');
    const basedOnVal = basedOnEl ? getLocalAttr(basedOnEl, 'val') : null;
    if (basedOnVal) def.basedOn = basedOnVal;

    const pPr = findDirectChild(styleEl, 'pPr');
    if (pPr) {
      const jcEl = findDirectChild(pPr, 'jc');
      const jcVal = jcEl ? getLocalAttr(jcEl, 'val') : null;
      if (jcVal === 'center') def.align = 'center';
      else if (jcVal === 'right' || jcVal === 'end') def.align = 'right';
      else if (jcVal === 'both' || jcVal === 'distribute') def.align = 'justify';
      else if (jcVal === 'left' || jcVal === 'start') def.align = 'left';

      const outlineEl = findDirectChild(pPr, 'outlineLvl');
      const outlineVal = outlineEl ? Number(getLocalAttr(outlineEl, 'val')) : NaN;
      if (!def.headingLevel && Number.isInteger(outlineVal) && outlineVal >= 0 && outlineVal <= 3) {
        def.headingLevel = (outlineVal + 1) as 1 | 2 | 3 | 4;
      }

      const spacingEl = findDirectChild(pPr, 'spacing');
      if (spacingEl) {
        const beforeRaw = Number(getLocalAttr(spacingEl, 'before'));
        const afterRaw = Number(getLocalAttr(spacingEl, 'after'));
        if (Number.isFinite(beforeRaw) && beforeRaw >= 0) {
          def.spacingBeforePx = twipsToPx(beforeRaw);
        }
        if (Number.isFinite(afterRaw) && afterRaw >= 0) {
          def.spacingAfterPx = twipsToPx(afterRaw);
        }
      }
    }

    const rPr = findDirectChild(styleEl, 'rPr');
    if (rPr) {
      const bEl = findDirectChild(rPr, 'b');
      if (bEl && getLocalAttr(bEl, 'val') !== '0' && getLocalAttr(bEl, 'val') !== 'false') {
        def.bold = true;
      }
      const iEl = findDirectChild(rPr, 'i');
      if (iEl && getLocalAttr(iEl, 'val') !== '0' && getLocalAttr(iEl, 'val') !== 'false') {
        def.italic = true;
      }
      const uEl = findDirectChild(rPr, 'u');
      if (uEl && getLocalAttr(uEl, 'val') !== 'none') {
        def.underline = true;
      }
      const szEl = findDirectChild(rPr, 'sz');
      const szVal = szEl ? Number(getLocalAttr(szEl, 'val')) : NaN;
      if (Number.isFinite(szVal) && szVal > 0) {
        def.fontSizePt = szVal / 2;
      }
      const colorEl = findDirectChild(rPr, 'color');
      const colorVal = colorEl ? normalizeHexColor(getLocalAttr(colorEl, 'val')) : null;
      if (colorVal) def.color = colorVal;
    }

    map.set(styleId, def);
  }

  return map;
}

function resolveStyleDef(
  styleId: string | null,
  stylesMap: Map<string, StyleDef>,
  visited = new Set<string>(),
): StyleDef {
  if (!styleId || visited.has(styleId)) return {};
  visited.add(styleId);
  const current = stylesMap.get(styleId);
  if (!current) return {};
  const parent = current.basedOn
    ? resolveStyleDef(current.basedOn, stylesMap, visited)
    : {};
  return { ...parent, ...current };
}

function parseRelsXml(xmlText: string): Map<string, string> {
  const rels = new Map<string, string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const relEls = Array.from(doc.getElementsByTagName('*')).filter(
    (el) => el.localName === 'Relationship',
  );
  for (const relEl of relEls) {
    const id = relEl.getAttribute('Id');
    const target = relEl.getAttribute('Target');
    if (id && target) {
      rels.set(id, target.replace(/^\//, ''));
    }
  }
  return rels;
}

function parseParagraphElement(
  pEl: Element,
  stylesMap: Map<string, StyleDef>,
  mediaUrlByRelId: Map<string, string>,
  listCounters: Map<string, number>,
): DocxParagraphBlock {
  const pPr = findDirectChild(pEl, 'pPr');
  const pStyleEl = pPr ? findDirectChild(pPr, 'pStyle') : null;
  const styleId = pStyleEl ? getLocalAttr(pStyleEl, 'val') : null;
  const resolvedStyle = resolveStyleDef(styleId, stylesMap);

  let align: 'left' | 'center' | 'right' | 'justify' =
    resolvedStyle.align ?? 'left';
  let headingLevel: 1 | 2 | 3 | 4 | null = resolvedStyle.headingLevel ?? null;
  let listMarker: string | null = null;
  let indentLeftPx = 0;
  let firstLineIndentPx = 0;
  let spacingBeforePx = resolvedStyle.spacingBeforePx ?? 0;
  let spacingAfterPx = resolvedStyle.spacingAfterPx ?? 4;
  let lineHeight: number | null = resolvedStyle.lineHeight ?? null;
  let backgroundColor: string | null = null;

  if (pPr) {
    const jcEl = findDirectChild(pPr, 'jc');
    const jcVal = jcEl ? getLocalAttr(jcEl, 'val') : null;
    if (jcVal === 'center') align = 'center';
    else if (jcVal === 'right' || jcVal === 'end') align = 'right';
    else if (jcVal === 'both' || jcVal === 'distribute') align = 'justify';
    else if (jcVal === 'left' || jcVal === 'start') align = 'left';

    const indEl = findDirectChild(pPr, 'ind');
    if (indEl) {
      const leftVal = Number(
        getLocalAttr(indEl, 'left') ?? getLocalAttr(indEl, 'start'),
      );
      const firstLineVal = Number(getLocalAttr(indEl, 'firstLine'));
      if (Number.isFinite(leftVal) && leftVal > 0) {
        indentLeftPx = Math.min(240, twipsToPx(leftVal));
      }
      if (Number.isFinite(firstLineVal) && firstLineVal > 0) {
        firstLineIndentPx = Math.min(120, twipsToPx(firstLineVal));
      }
    }

    const spacingEl = findDirectChild(pPr, 'spacing');
    if (spacingEl) {
      const beforeRaw = Number(getLocalAttr(spacingEl, 'before'));
      const afterRaw = Number(getLocalAttr(spacingEl, 'after'));
      const lineRaw = Number(getLocalAttr(spacingEl, 'line'));
      if (Number.isFinite(beforeRaw) && beforeRaw >= 0) {
        spacingBeforePx = Math.min(64, twipsToPx(beforeRaw));
      }
      if (Number.isFinite(afterRaw) && afterRaw >= 0) {
        spacingAfterPx = Math.min(64, twipsToPx(afterRaw));
      }
      if (Number.isFinite(lineRaw) && lineRaw > 0) {
        // 240 = single spacing (1.15 - 1.35 in web reading)
        lineHeight = Math.max(1.15, Math.min(2.5, Math.round((lineRaw / 240) * 1.25 * 100) / 100));
      }
    }

    const shdEl = findDirectChild(pPr, 'shd');
    if (shdEl) {
      backgroundColor = normalizeHexColor(getLocalAttr(shdEl, 'fill'));
    }

    const numPrEl = findDirectChild(pPr, 'numPr');
    if (numPrEl) {
      const ilvlEl = findDirectChild(numPrEl, 'ilvl');
      const numIdEl = findDirectChild(numPrEl, 'numId');
      const ilvl = Number(ilvlEl ? getLocalAttr(ilvlEl, 'val') : 0) || 0;
      const numId = numIdEl ? getLocalAttr(numIdEl, 'val') : '1';
      if (numId && numId !== '0') {
        const key = `${numId}:${ilvl}`;
        const nextCount = (listCounters.get(key) ?? 0) + 1;
        listCounters.set(key, nextCount);
        listMarker = '•';
        if (indentLeftPx === 0) {
          indentLeftPx = (ilvl + 1) * 20;
        }
      }
    }
  }

  const runs: DocxRun[] = [];

  const collectRunsFromContainer = (container: Element) => {
    for (let i = 0; i < container.children.length; i += 1) {
      const child = container.children[i];
      if (!child) continue;

      if (child.localName === 'hyperlink') {
        collectRunsFromContainer(child);
        continue;
      }

      if (child.localName !== 'r') continue;

      const rPr = findDirectChild(child, 'rPr');
      let bold = resolvedStyle.bold ?? false;
      let italic = resolvedStyle.italic ?? false;
      let underline = resolvedStyle.underline ?? false;
      let strike = resolvedStyle.strike ?? false;
      let vertAlign: 'superscript' | 'subscript' | null = null;
      let fontSizePt: number | null = resolvedStyle.fontSizePt ?? null;
      let fontFamily: string | null = resolvedStyle.fontFamily ?? null;
      let color: string | null = resolvedStyle.color ?? null;
      let runBg: string | null = null;

      if (rPr) {
        const bEl = findDirectChild(rPr, 'b');
        if (bEl) {
          const val = getLocalAttr(bEl, 'val');
          bold = val !== '0' && val !== 'false';
        }
        const iEl = findDirectChild(rPr, 'i');
        if (iEl) {
          const val = getLocalAttr(iEl, 'val');
          italic = val !== '0' && val !== 'false';
        }
        const uEl = findDirectChild(rPr, 'u');
        if (uEl) {
          const val = getLocalAttr(uEl, 'val');
          underline = val !== 'none' && val !== '0' && val !== 'false';
        }
        const strikeEl =
          findDirectChild(rPr, 'strike') ?? findDirectChild(rPr, 'dstrike');
        if (strikeEl) {
          const val = getLocalAttr(strikeEl, 'val');
          strike = val !== '0' && val !== 'false';
        }
        const vertEl = findDirectChild(rPr, 'vertAlign');
        if (vertEl) {
          const val = getLocalAttr(vertEl, 'val');
          if (val === 'superscript' || val === 'subscript') {
            vertAlign = val;
          }
        }
        const szEl = findDirectChild(rPr, 'sz');
        if (szEl) {
          const szVal = Number(getLocalAttr(szEl, 'val'));
          if (Number.isFinite(szVal) && szVal > 0) {
            fontSizePt = szVal / 2;
          }
        }
        const rFontsEl = findDirectChild(rPr, 'rFonts');
        if (rFontsEl) {
          fontFamily =
            getLocalAttr(rFontsEl, 'ascii') ??
            getLocalAttr(rFontsEl, 'hAnsi') ??
            null;
        }
        const colorEl = findDirectChild(rPr, 'color');
        if (colorEl) {
          color = normalizeHexColor(getLocalAttr(colorEl, 'val')) ?? color;
        }
        const highlightEl = findDirectChild(rPr, 'highlight');
        if (highlightEl) {
          const hlVal = getLocalAttr(highlightEl, 'val');
          if (hlVal && HIGHLIGHT_COLOR_MAP[hlVal]) {
            runBg = HIGHLIGHT_COLOR_MAP[hlVal] ?? null;
          }
        }
        const shdEl = findDirectChild(rPr, 'shd');
        if (shdEl && !runBg) {
          runBg = normalizeHexColor(getLocalAttr(shdEl, 'fill'));
        }
      }

      for (let j = 0; j < child.children.length; j += 1) {
        const node = child.children[j];
        if (!node) continue;

        if (node.localName === 't') {
          runs.push({
            text: node.textContent ?? '',
            bold,
            italic,
            underline,
            strike,
            vertAlign,
            fontSizePt,
            fontFamily,
            color,
            backgroundColor: runBg,
          });
        } else if (node.localName === 'tab') {
          runs.push({
            text: '\t',
            isTab: true,
          });
        } else if (node.localName === 'br' || node.localName === 'cr') {
          runs.push({
            text: '\n',
            isBreak: true,
          });
        } else if (node.localName === 'drawing' || node.localName === 'pict') {
          const blips = Array.from(node.getElementsByTagName('*')).filter(
            (el) => el.localName === 'blip' || el.localName === 'imagedata',
          );
          const extentEl = Array.from(node.getElementsByTagName('*')).find(
            (el) => el.localName === 'extent',
          );
          let imageWidthPx: number | null = null;
          let imageHeightPx: number | null = null;
          if (extentEl) {
            const cx = Number(extentEl.getAttribute('cx'));
            const cy = Number(extentEl.getAttribute('cy'));
            if (Number.isFinite(cx) && cx > 0) imageWidthPx = emuToPx(cx);
            if (Number.isFinite(cy) && cy > 0) imageHeightPx = emuToPx(cy);
          }

          for (const blip of blips) {
            const embedId =
              blip.getAttribute('r:embed') ??
              blip.getAttribute('r:id') ??
              getLocalAttr(blip, 'embed') ??
              getLocalAttr(blip, 'id');
            if (embedId && mediaUrlByRelId.has(embedId)) {
              runs.push({
                text: '',
                imageUrl: mediaUrlByRelId.get(embedId) ?? null,
                imageAlt: 'Hình minh họa trong tài liệu',
                imageWidthPx,
                imageHeightPx,
              });
            }
          }
        }
      }
    }
  };

  collectRunsFromContainer(pEl);

  const hasVisibleContent = runs.some(
    (r) => r.text.length > 0 || Boolean(r.imageUrl) || Boolean(r.isBreak),
  );

  return {
    type: 'paragraph',
    align,
    headingLevel,
    listMarker,
    indentLeftPx,
    firstLineIndentPx,
    spacingBeforePx,
    spacingAfterPx,
    lineHeight,
    backgroundColor,
    isEmpty: !hasVisibleContent,
    runs,
  };
}

function parseTableElement(
  tblEl: Element,
  stylesMap: Map<string, StyleDef>,
  mediaUrlByRelId: Map<string, string>,
  listCounters: Map<string, number>,
): DocxTableBlock {
  const rows: DocxTableRow[] = [];
  const trEls = findDirectChildren(tblEl, 'tr');

  for (const trEl of trEls) {
    const cells: DocxTableCell[] = [];
    const tcEls = findDirectChildren(trEl, 'tc');

    for (const tcEl of tcEls) {
      const tcPr = findDirectChild(tcEl, 'tcPr');
      let colSpan = 1;
      let backgroundColor: string | null = null;

      if (tcPr) {
        const gridSpanEl = findDirectChild(tcPr, 'gridSpan');
        const spanVal = gridSpanEl ? Number(getLocalAttr(gridSpanEl, 'val')) : 1;
        if (Number.isInteger(spanVal) && spanVal > 1) {
          colSpan = spanVal;
        }
        const shdEl = findDirectChild(tcPr, 'shd');
        if (shdEl) {
          backgroundColor = normalizeHexColor(getLocalAttr(shdEl, 'fill'));
        }
      }

      const cellParagraphs: DocxParagraphBlock[] = [];
      const pEls = findDirectChildren(tcEl, 'p');
      for (const pEl of pEls) {
        cellParagraphs.push(
          parseParagraphElement(pEl, stylesMap, mediaUrlByRelId, listCounters),
        );
      }

      cells.push({
        colSpan,
        backgroundColor,
        paragraphs: cellParagraphs,
      });
    }

    if (cells.length > 0) {
      rows.push({ cells });
    }
  }

  return {
    type: 'table',
    rows,
  };
}

export async function parseDocxArrayBuffer(
  buffer: ArrayBuffer,
): Promise<ParsedDocxDocument> {
  const entries = parseZipDirectory(buffer);
  const entryByName = new Map<string, ZipEntryMeta>();
  for (const entry of entries) {
    entryByName.set(entry.name, entry);
  }

  const decoder = new TextDecoder('utf-8');
  const objectUrls: string[] = [];

  // 1. Đọc styles.xml nếu có
  let stylesMap = new Map<string, StyleDef>();
  const stylesEntry = entryByName.get('word/styles.xml');
  if (stylesEntry) {
    const stylesBytes = await extractZipEntryBytes(buffer, stylesEntry);
    if (stylesBytes) {
      stylesMap = parseStylesXml(decoder.decode(stylesBytes));
    }
  }

  // 2. Đọc word/_rels/document.xml.rels và giải nén hình ảnh trong word/media/*
  const mediaUrlByRelId = new Map<string, string>();
  const relsEntry = entryByName.get('word/_rels/document.xml.rels');
  if (relsEntry) {
    const relsBytes = await extractZipEntryBytes(buffer, relsEntry);
    if (relsBytes) {
      const relMap = parseRelsXml(decoder.decode(relsBytes));
      for (const [relId, target] of relMap.entries()) {
        const normalizedTarget = target.startsWith('word/')
          ? target
          : `word/${target.replace(/^\.\//, '')}`;
        const mediaEntry = entryByName.get(normalizedTarget);
        if (mediaEntry && normalizedTarget.startsWith('word/media/')) {
          const mediaBytes = await extractZipEntryBytes(buffer, mediaEntry);
          if (mediaBytes) {
            const ext = normalizedTarget.split('.').pop()?.toLowerCase() ?? 'png';
            const mime =
              ext === 'jpg' || ext === 'jpeg'
                ? 'image/jpeg'
                : ext === 'gif'
                  ? 'image/gif'
                  : ext === 'webp'
                    ? 'image/webp'
                    : ext === 'svg'
                      ? 'image/svg+xml'
                      : 'image/png';
            const copy = new Uint8Array(mediaBytes.byteLength);
            copy.set(mediaBytes);
            const blob = new Blob([copy], { type: mime });
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            mediaUrlByRelId.set(relId, url);
          }
        }
      }
    }
  }

  // 3. Đọc word/document.xml
  const docEntry = entryByName.get('word/document.xml');
  if (!docEntry) {
    throw new Error('Không tìm thấy nội dung word/document.xml trong file .docx');
  }
  const docBytes = await extractZipEntryBytes(buffer, docEntry);
  if (!docBytes) {
    throw new Error('Không thể giải nén nội dung file Word (.docx)');
  }

  const xmlText = decoder.decode(docBytes);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  const bodyEl = Array.from(xmlDoc.getElementsByTagName('*')).find(
    (el) => el.localName === 'body',
  );

  if (!bodyEl) {
    return { blocks: [], plainText: '', objectUrls };
  }

  const blocks: DocxBlock[] = [];
  const plainLines: string[] = [];
  const listCounters = new Map<string, number>();

  for (let i = 0; i < bodyEl.children.length; i += 1) {
    const el = bodyEl.children[i];
    if (!el) continue;

    if (el.localName === 'p') {
      const pBlock = parseParagraphElement(
        el,
        stylesMap,
        mediaUrlByRelId,
        listCounters,
      );
      blocks.push(pBlock);
      const lineText = pBlock.runs.map((r) => r.text).join('').trim();
      if (lineText) plainLines.push(lineText);
    } else if (el.localName === 'tbl') {
      const tblBlock = parseTableElement(
        el,
        stylesMap,
        mediaUrlByRelId,
        listCounters,
      );
      blocks.push(tblBlock);
      for (const row of tblBlock.rows) {
        for (const cell of row.cells) {
          for (const p of cell.paragraphs) {
            const lineText = p.runs.map((r) => r.text).join('').trim();
            if (lineText) plainLines.push(lineText);
          }
        }
      }
    }
  }

  return {
    blocks,
    plainText: plainLines.join('\n'),
    objectUrls,
  };
}

