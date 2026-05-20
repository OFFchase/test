import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { config } from '../config.js';

let cachedFontBytes = null;
let cachedTemplateBytes = null;

async function loadFontBytes() {
  if (!cachedFontBytes) {
    const res = await fetch(config.fontPath);
    if (!res.ok) throw new Error(`Failed to load font from ${config.fontPath}`);
    cachedFontBytes = await res.arrayBuffer();
  }
  return cachedFontBytes;
}

async function loadTemplateBytes() {
  if (!cachedTemplateBytes) {
    const res = await fetch(config.pdfTemplatePath);
    if (!res.ok) {
      throw new Error(
        `Template PDF not found at ${config.pdfTemplatePath}. ` +
          `Place your certificate PDF at public/template.pdf.`,
      );
    }
    cachedTemplateBytes = await res.arrayBuffer();
  }
  return cachedTemplateBytes;
}

/**
 * Apply a case style to a string.
 *   'upper'      -> "ВИСИТОВ ИЗРАИЛ АЛМИРЗАЕВИЧ"
 *   'capitalize' -> "Виситов Израил Алмирзаевич"
 *   anything else -> unchanged
 */
export function transformCase(s, caseStyle) {
  if (caseStyle === 'upper') return s.toUpperCase();
  if (caseStyle === 'capitalize') {
    return s
      .toLocaleLowerCase()
      .replace(/(^|\s)(\S)/g, (m) => m.toLocaleUpperCase());
  }
  return s;
}

/**
 * Split a full name into lines based on "break after word N" (1-based).
 *   N = 0 (or invalid)  -> single line, no break
 *   N >= word count     -> single line, no break (nothing left to break off)
 *   otherwise           -> two lines split at that word index
 * Example: splitName("Виситов Израил Алмирзаевич", 1)
 *   => ["Виситов", "Израил Алмирзаевич"]
 */
export function splitName(fio, breakAfterWord) {
  const words = (fio || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const n = Number(breakAfterWord);
  if (!n || n < 1 || n >= words.length) return [words.join(' ')];
  return [words.slice(0, n).join(' '), words.slice(n).join(' ')];
}

function resolveColor(colorKey) {
  const c = config.text.colors[colorKey];
  if (!c) throw new Error(`Unknown color "${colorKey}"`);
  return rgb(c.r, c.g, c.b);
}

function drawNameLines(page, lines, font, { color, caseStyle }) {
  const { text } = config;
  const fontSize = text.fontSize;
  const lineGap = fontSize * text.lineHeight;
  const pdfColor = resolveColor(color);

  lines.forEach((rawLine, i) => {
    const line = transformCase(rawLine, caseStyle);
    const width = font.widthOfTextAtSize(line, fontSize);

    let x;
    if (text.align === 'left') x = text.centerX;
    else if (text.align === 'right') x = text.centerX - width;
    else x = text.centerX - width / 2;

    const y = text.firstLineBaselineY - i * lineGap;

    page.drawText(line, { x, y, size: fontSize, font, color: pdfColor });
  });
}

/**
 * Generate a PDF for a single participant.
 *  - mode = 'full'     -> load template.pdf and overlay the name
 *  - mode = 'nameOnly' -> blank page with just the name
 *  - color             -> 'dark' | 'white'
 *  - caseStyle         -> 'upper' | 'capitalize'
 * Returns a Blob (application/pdf).
 */
export async function generateCertificate({
  fio,
  breakAfterWord,
  mode,
  color,
  caseStyle,
}) {
  const lines = splitName(fio, breakAfterWord ?? config.defaultBreakAfterWord);
  const fontBytes = await loadFontBytes();

  let pdfDoc;
  let page;

  if (mode === 'full') {
    const templateBytes = await loadTemplateBytes();
    pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    page = pdfDoc.getPages()[0];
  } else {
    pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    page = pdfDoc.addPage([
      config.blankPageSize.width,
      config.blankPageSize.height,
    ]);
  }

  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  drawNameLines(page, lines, font, { color, caseStyle });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Generate one combined PDF with one page per participant.
 */
export async function generateBatchCertificate({
  participants,
  mode,
  color,
  caseStyle,
}) {
  const fontBytes = await loadFontBytes();
  const outDoc = await PDFDocument.create();
  outDoc.registerFontkit(fontkit);
  const font = await outDoc.embedFont(fontBytes, { subset: true });

  let templateDoc = null;
  if (mode === 'full') {
    const templateBytes = await loadTemplateBytes();
    templateDoc = await PDFDocument.load(templateBytes);
  }

  for (const p of participants) {
    const lines = splitName(
      p.fio,
      p.breakAfterWord ?? config.defaultBreakAfterWord,
    );

    let page;
    if (mode === 'full') {
      const [copied] = await outDoc.copyPages(templateDoc, [0]);
      page = outDoc.addPage(copied);
    } else {
      page = outDoc.addPage([
        config.blankPageSize.width,
        config.blankPageSize.height,
      ]);
    }
    drawNameLines(page, lines, font, { color, caseStyle });
  }

  const bytes = await outDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Open a Blob in a new tab and trigger the browser print dialog.
 */
export function printPdfBlob(blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    // Pop-ups blocked – fall back to download.
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate.pdf';
    a.click();
    return;
  }
  w.addEventListener('load', () => {
    try {
      w.focus();
      w.print();
    } catch {
      /* user can still print manually */
    }
  });
}
