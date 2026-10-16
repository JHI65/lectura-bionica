// Vista previa de un documento ya extraído: selector de sección y lector.
// La comparten la conversión de un archivo y el modo por lotes.
import { useDeferredValue, useMemo, useState } from 'react';
import { Alert } from './Alert';
import { ReaderPreview } from './ReaderPreview';
import { btnSecondary } from './ui';
import { useI18n } from '../i18n/useI18n';
import type { ReadingSettings } from '../lib/bionic/settings';
import type { EpubSection, ParsedDocument, PdfSection } from '../lib/document';
import { previewCss, sectionBodyHtml } from '../lib/preview';
import type { AppWarning } from '../lib/warnings';

export function WarningList({ warnings }: { warnings: AppWarning[] }) {
  const { t } = useI18n();
  return (
    <ul className="list-disc space-y-1 pl-5">
      {warnings.map((w) => {
        const text = t.warnings[w.code](w.params ?? {});
        return <li key={`${w.code}:${text}`}>{text}</li>;
      })}
    </ul>
  );
}

/** Se monta de nuevo (con `key`) al cambiar de documento para volver a la primera sección. */
export function DocumentPreview({ doc, settings, idSuffix = '' }: { doc: ParsedDocument; settings: ReadingSettings; idSuffix?: string }) {
  const { t, locale } = useI18n();
  const [sectionIndex, setSectionIndex] = useState(0);
  // Los sliders siguen respondiendo mientras la vista previa se recalcula.
  const deferredSettings = useDeferredValue(settings);

  const safeIndex = Math.min(sectionIndex, doc.sections.length - 1);
  const section = doc.sections[safeIndex];

  const sectionLabel = (value: EpubSection | PdfSection, index: number): string => {
    if ('pageNumber' in value) return t.converter.pdfPage(value.pageNumber);
    return value.title ?? t.converter.sectionFallback(index + 1);
  };

  // La negrita solo se recalcula si cambia la cantidad de letras o el interruptor;
  // la tipografía y el tema se aplican como CSS, sin volver a transformar.
  const { boldRatio, bionicEnabled } = deferredSettings;
  const previewBody = useMemo(() => {
    const current = doc.sections[Math.min(sectionIndex, doc.sections.length - 1)];
    if (!current) return `<p>${t.converter.noText}</p>`;
    return sectionBodyHtml(doc, current, { ...deferredSettings, boldRatio, bionicEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, sectionIndex, boldRatio, bionicEnabled, locale]);
  const css = useMemo(() => previewCss(settings), [settings]);

  const selectId = `section-select${idSuffix}`;
  return (
    <div className="space-y-4">
      {doc.sections.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${btnSecondary} px-3`}
            onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
            disabled={safeIndex === 0}
            aria-label={t.converter.previous}
          >
            ←
          </button>
          <label className="sr-only" htmlFor={selectId}>
            {t.converter.chooseSection}
          </label>
          <select
            id={selectId}
            value={safeIndex}
            onChange={(e) => setSectionIndex(Number(e.target.value))}
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            {doc.sections.map((s, i) => (
              <option key={s.id} value={i}>
                {sectionLabel(s, i)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${btnSecondary} px-3`}
            onClick={() => setSectionIndex((i) => Math.min(doc.sections.length - 1, i + 1))}
            disabled={safeIndex >= doc.sections.length - 1}
            aria-label={t.converter.next}
          >
            →
          </button>
        </div>
      )}

      <ReaderPreview
        body={previewBody}
        css={css}
        lang={locale}
        resetKey={`${doc.fileName}:${section?.id ?? ''}`}
        title={t.converter.previewTitle(section ? sectionLabel(section, safeIndex) : doc.title)}
      />

      {doc.warnings.length > 0 && (
        <Alert tone="info" title={t.converter.warningsTitle}>
          <WarningList warnings={doc.warnings} />
        </Alert>
      )}
    </div>
  );
}
