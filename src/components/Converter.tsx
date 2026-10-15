import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from './Alert';
import { AdSlot } from './AdSlot';
import { Dropzone } from './Dropzone';
import { ReaderPreview } from './ReaderPreview';
import { SettingsPanel } from './SettingsPanel';
import { StepTracker } from './StepTracker';
import { btnPrimary, btnSecondary, card, linkBtn } from './ui';
import { useSettings } from '../hooks/useSettings';
import { useI18n } from '../i18n/useI18n';
import type { Progress } from '../lib/async';
import { ConversionError, toConversionError, type ConversionErrorCode, type ErrorParams } from '../lib/files/errors';
import { formatBytes } from '../lib/files/validate';
import type { EpubSection, ParsedDocument, PdfSection } from '../lib/document';
import { downloadBlob } from '../lib/download';
import { previewCss, sectionBodyHtml } from '../lib/preview';
import { track } from '../lib/state/analytics';
import type { AppWarning } from '../lib/warnings';

type Phase = 'idle' | 'reading' | 'ready' | 'exporting' | 'done' | 'error';

interface Failure {
  code: ConversionErrorCode;
  params: ErrorParams;
}

// Paso activo del indicador: 0 Importar, 1 Extraer, 2 Lectura biónica, 3 Personalizar, 4 Exportar.
const STEP_BY_PHASE: Record<Phase, number> = { idle: 0, reading: 1, error: 0, ready: 3, exporting: 4, done: 4 };

function failureFrom(error: unknown, fallback: 'UNKNOWN' | 'EXPORT_FAILED'): Failure {
  const conversion = error instanceof ConversionError ? error : toConversionError(error, fallback);
  track('conversion_error', { error_code: conversion.code });
  return { code: conversion.code, params: conversion.params };
}

function isCancelled(error: unknown): boolean {
  return error instanceof ConversionError && error.code === 'CANCELLED';
}

function ProgressPanel({ progress, onCancel, label }: { progress: Progress | null; onCancel: () => void; label: string }) {
  const { t } = useI18n();
  const percent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm font-medium">
        {progress
          ? t.converter.progressOf(t.converter.stage[progress.stage], Math.min(progress.done + 1, progress.total), progress.total)
          : label}
      </p>
      <progress className="h-2 w-full overflow-hidden rounded-full accent-brand" max={100} value={percent ?? undefined} aria-label={t.converter.progress} />
      <button type="button" className={btnSecondary} onClick={onCancel}>
        {t.converter.cancel}
      </button>
    </div>
  );
}

function WarningList({ warnings }: { warnings: AppWarning[] }) {
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

/**
 * Herramienta de conversión completa (importar → vista previa → descargar).
 * Se usa en la portada y en /convertir. Los parsers (epub.js, pdf.js) se cargan
 * de forma diferida al subir el primer archivo, para no pesar en la portada.
 */
export function Converter() {
  const { t, locale, numberLocale, href } = useI18n();
  const { settings, update, reset } = useSettings();
  // Los sliders siguen respondiendo mientras la vista previa se recalcula.
  const deferredSettings = useDeferredValue(settings);

  const [phase, setPhase] = useState<Phase>('idle');
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [exportFailure, setExportFailure] = useState<Failure | null>(null);
  const [exportWarnings, setExportWarnings] = useState<AppWarning[]>([]);
  const [doneFile, setDoneFile] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [progress, setProgress] = useState<Progress | null>(null);

  // La operación en curso se puede cancelar, y `busy` evita lanzarla dos veces
  // aunque el usuario pulse varias veces antes de que React repinte.
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  useEffect(() => () => abortRef.current?.abort(), []);

  const safeIndex = doc ? Math.min(sectionIndex, doc.sections.length - 1) : 0;
  const section = doc?.sections[safeIndex];

  const sectionLabel = (value: EpubSection | PdfSection, index: number): string => {
    if ('pageNumber' in value) return t.converter.pdfPage(value.pageNumber);
    return value.title ?? t.converter.sectionFallback(index + 1);
  };

  // La negrita solo se recalcula si cambia la cantidad de letras o el interruptor;
  // la tipografía y el tema se aplican como CSS, sin volver a transformar.
  const { boldRatio, bionicEnabled } = deferredSettings;
  const previewBody = useMemo(() => {
    if (!doc) return '';
    const current = doc.sections[Math.min(sectionIndex, doc.sections.length - 1)];
    if (!current) return `<p>${t.converter.noText}</p>`;
    return sectionBodyHtml(doc, current, { ...deferredSettings, boldRatio, bionicEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, sectionIndex, boldRatio, bionicEnabled, locale]);
  const css = useMemo(() => previewCss(settings), [settings]);

  const cancel = () => abortRef.current?.abort();

  const handleFile = async (file: File) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('reading');
    setFailure(null);
    setExportFailure(null);
    setDoneFile(null);
    setDoc(null);
    setProgress(null);
    setFileSize(file.size);
    track('conversion_started', { lang: locale });
    try {
      const { parseDocument } = await import('../lib/convert');
      const parsed = await parseDocument(file, { signal: controller.signal, onProgress: setProgress });
      setDoc(parsed);
      setSectionIndex(0);
      setPhase('ready');
      track('format_imported', { format: parsed.kind, lang: locale });
    } catch (error) {
      if (isCancelled(error)) {
        setPhase('idle');
      } else {
        setFailure(failureFrom(error, 'UNKNOWN'));
        setPhase('error');
      }
    } finally {
      busyRef.current = false;
      abortRef.current = null;
      setProgress(null);
    }
  };

  const handleExport = async () => {
    if (!doc || busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('exporting');
    setExportFailure(null);
    setProgress(null);
    try {
      const { exportDocument } = await import('../lib/convert');
      const result = await exportDocument(doc, settings, { signal: controller.signal, onProgress: setProgress, locale });
      downloadBlob(result.blob, result.fileName);
      setExportWarnings(result.warnings);
      setDoneFile(result.fileName);
      setPhase('done');
      track('conversion_completed', { format: doc.kind, intensity: settings.intensity, bionic: settings.bionicEnabled, lang: locale });
      track('download_completed', { format: doc.kind, lang: locale });
    } catch (error) {
      // El documento se conserva: el usuario puede ajustar y reintentar.
      if (!isCancelled(error)) setExportFailure(failureFrom(error, 'EXPORT_FAILED'));
      setPhase('ready');
    } finally {
      busyRef.current = false;
      abortRef.current = null;
      setProgress(null);
    }
  };

  const restart = () => {
    abortRef.current?.abort();
    setDoc(null);
    setFailure(null);
    setExportFailure(null);
    setDoneFile(null);
    setPhase('idle');
  };

  const isWorking = phase === 'reading' || phase === 'exporting';
  const noun = doc?.kind === 'epub' ? 'EPUB' : 'PDF';
  const message = (f: Failure) => t.errors[f.code](f.params, numberLocale);

  return (
    <div className="space-y-8">
      <StepTracker current={STEP_BY_PHASE[phase]} />

      {phase === 'idle' && (
        <div>
          <section aria-labelledby="import-title" className="space-y-4">
            <h2 id="import-title" className="sr-only">
              {t.dropzone.title}
            </h2>
            <Dropzone onFile={handleFile} />
            <div className={`${card} text-sm leading-relaxed text-ink-soft`}>
              <p className="font-semibold text-ink">{t.converter.privacyTitle}</p>
              <p className="mt-1">{t.converter.privacyBody}</p>
              <p className="mt-3">
                {t.converter.ocrNote}{' '}
                <Link className={linkBtn} to={href('guide-pdf')}>
                  {t.converter.ocrLink}
                </Link>
              </p>
            </div>
          </section>
        </div>
      )}

      {phase === 'reading' && (
        <div className={`${card} mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center`}>
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" aria-hidden="true" />
          <p className="text-lg font-semibold">{t.converter.readingTitle}</p>
          <p className="max-w-md text-sm text-ink-soft">{t.converter.readingBody(formatBytes(fileSize, numberLocale))}</p>
          <div className="w-full max-w-sm text-left">
            <ProgressPanel progress={progress} onCancel={cancel} label={t.converter.preparing} />
          </div>
        </div>
      )}

      {phase === 'error' && failure && (
        <div className="space-y-6">
          <Alert tone="error" title={t.converter.errorTitle}>
            <p>{message(failure)}</p>
            <p className="mt-2 text-xs opacity-80">
              {t.converter.codeLabel}: {failure.code}
            </p>
          </Alert>
          <Dropzone onFile={handleFile} />
          <button type="button" className={btnSecondary} onClick={restart}>
            {t.converter.restart}
          </button>
        </div>
      )}

      {doc && (phase === 'ready' || phase === 'exporting' || phase === 'done') && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="preview-title" className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="preview-title" className="truncate text-lg font-semibold">
                  {doc.title}
                </h2>
                <p className="text-sm text-ink-soft">
                  {t.converter.summary(noun, formatBytes(fileSize, numberLocale), doc.sections.length, doc.kind)}
                </p>
              </div>
              <button type="button" className={btnSecondary} onClick={restart}>
                {t.converter.changeDocument}
              </button>
            </div>

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
                <label className="sr-only" htmlFor="section-select">
                  {t.converter.chooseSection}
                </label>
                <select
                  id="section-select"
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
          </section>

          <aside className="space-y-6" aria-label={t.converter.settingsAria}>
            <div className={card}>
              <h2 className="mb-4 text-base font-semibold">{t.converter.settingsTitle}</h2>
              <SettingsPanel settings={settings} onChange={update} onReset={reset} />
            </div>

            <div className={`${card} space-y-4`}>
              <h2 className="text-base font-semibold">{t.converter.downloadTitle}</h2>
              <p className="text-sm leading-relaxed text-ink-soft">
                {doc.kind === 'epub' ? t.converter.downloadEpub : t.converter.downloadPdf}
              </p>
              {exportFailure && (
                <Alert tone="error" title={t.converter.exportErrorTitle}>
                  <p>{message(exportFailure)}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {t.converter.codeLabel}: {exportFailure.code}
                  </p>
                </Alert>
              )}
              {phase === 'exporting' ? (
                <ProgressPanel progress={progress} onCancel={cancel} label={t.converter.generating} />
              ) : (
                <button type="button" className={`${btnPrimary} w-full`} onClick={handleExport} disabled={isWorking}>
                  {t.converter.download(noun)}
                </button>
              )}
              {phase === 'done' && doneFile && (
                <Alert tone="success" title={t.converter.doneTitle}>
                  <p className="break-all">{doneFile}</p>
                  {exportWarnings.length > 0 && (
                    <div className="mt-2">
                      <WarningList warnings={exportWarnings} />
                    </div>
                  )}
                </Alert>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Zona secundaria: solo tras completar la conversión, lejos de los controles. */}
      {phase === 'done' && <AdSlot className="mx-auto max-w-3xl" />}
    </div>
  );
}
