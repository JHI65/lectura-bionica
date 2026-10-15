// CSS de lectura generado a partir de los ajustes. Se usa en la vista previa
// (iframe aislado) y se incrusta en el EPUB exportado: una única fuente de verdad.

import { FONT_STACK, INTENSITY_REST_OPACITY, READING_WIDTH_CH, type ReadingSettings } from './settings';

const THEME_COLORS: Record<ReadingSettings['theme'], { bg: string; fg: string; link: string }> = {
  claro: { bg: '#ffffff', fg: '#1c1f24', link: '#1d4ed8' },
  sepia: { bg: '#f6efe0', fg: '#3b2f1e', link: '#7c4a12' },
  oscuro: { bg: '#15171c', fg: '#e8e9ec', link: '#8ab4ff' },
};

export function themeColors(theme: ReadingSettings['theme']) {
  return THEME_COLORS[theme];
}

export function readerCss(settings: ReadingSettings, options: { includeColors: boolean }): string {
  const colors = THEME_COLORS[settings.theme];
  const colorRules = options.includeColors
    ? `html, body { background: ${colors.bg}; color: ${colors.fg}; }
a { color: ${colors.link}; }`
    : '';

  return `
body {
  font-family: ${FONT_STACK[settings.fontFamily]};
  font-size: ${settings.fontSize}px;
  line-height: ${settings.lineHeight};
  letter-spacing: ${settings.letterSpacing}em;
  max-width: ${READING_WIDTH_CH[settings.readingWidth]}ch;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
  overflow-wrap: break-word;
  hyphens: manual;
}
img { max-width: 100%; height: auto; }
.bionic-text b { font-weight: 700; }
.bionic-rest { opacity: ${INTENSITY_REST_OPACITY[settings.intensity]}; }
${colorRules}
`.trim();
}
