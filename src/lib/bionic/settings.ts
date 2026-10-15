// Ajustes de lectura. Son datos puros: los consumen la vista previa (CSS)
// y los exportadores (EPUB/PDF) sin acoplarse a ningún formato concreto.

export type Intensity = 'suave' | 'media' | 'alta';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type ReadingTheme = 'claro' | 'sepia' | 'oscuro';

export interface ReadingSettings {
  bionicEnabled: boolean;
  intensity: Intensity;
  /** Proporción de letras de cada palabra en negrita (0.2–0.8). */
  boldRatio: number;
  fontSize: number; // px en vista previa, pt en PDF
  fontFamily: FontFamily;
  lineHeight: number; // múltiplo
  letterSpacing: number; // em
  readingWidth: 'estrecho' | 'medio' | 'ancho';
  theme: ReadingTheme;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  bionicEnabled: true,
  intensity: 'media',
  boldRatio: 0.5,
  fontSize: 18,
  fontFamily: 'sans',
  lineHeight: 1.7,
  letterSpacing: 0.01,
  readingWidth: 'medio',
  theme: 'claro',
};

// Proporción fija de letras de cada palabra que se muestran en negrita
// (el estándar habitual es 40-50 %). Las palabras de 1-3 letras resaltan solo
// la primera: ver boldLetterCount. Es una herramienta de personalización
// visual: no implica ningún beneficio clínico.
export const BIONIC_RATIO = 0.5;
export const BOLD_RATIO_MIN = 0.2;
export const BOLD_RATIO_MAX = 0.8;

// La intensidad controla el contraste: opacidad del resto de cada palabra
// (la parte que no va en negrita). Menor opacidad = más contraste.
export const INTENSITY_REST_OPACITY: Record<Intensity, number> = {
  suave: 0.7,
  media: 0.5,
  alta: 0.35,
};

export const INTENSITY_LABEL: Record<Intensity, string> = {
  suave: 'Suave',
  media: 'Media',
  alta: 'Alta',
};

export const FONT_STACK: Record<FontFamily, string> = {
  sans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  mono: '"SFMono-Regular", Menlo, Consolas, monospace',
};

export const READING_WIDTH_CH: Record<ReadingSettings['readingWidth'], number> = {
  estrecho: 45,
  medio: 66,
  ancho: 90,
};
