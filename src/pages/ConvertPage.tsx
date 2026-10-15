import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { AdSlot } from '../components/AdSlot';
import { Dropzone } from '../components/Dropzone';
import { ReaderPreview } from '../components/ReaderPreview';
import { SettingsPanel } from '../components/SettingsPanel';
import { StepTracker } from '../components/StepTracker';
import { btnPrimary, btnSecondary, card, linkBtn, sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSettings } from '../hooks/useSettings';
import { exportDocument, parseDocument } from '../lib/convert';
import { ConversionError, toConversionError } from '../lib/files/errors';
import type { ParsedDocument } from '../lib/document';
import { downloadBlob } from '../lib/download';
import { previewCss, sectionBodyHtml } from '../lib/preview';
import { track } from '../lib/state/analytics';

type Phase = 'idle' | 'reading' | 'ready' | 'exporting' | 'done' | 'error';

interface Failure {
  code: string;
  message: string;
}

// Paso activo del indicador: 0 Importar, 1 Extraer, 2 Lectura biónica, 3 Personalizar, 4 Exportar.
const STEP_BY_PHASE: Record<Phase, number> = { idle: 0, reading: 1, error: 0, ready: 3, exporting: 4, done: 4 };

function failureFrom(error: unknown, fallback: 'UNKNOWN' | 'EXPORT_FAILED'): Failure {
  const conversion = error instanceof ConversionError ? error : toConversionError(error, fallback);
  track('conversion_error', { error_code: conversion.code });
  return { code: conversion.code, message: conversion.message };
}

export function ConvertPage() {
  useDocumentMeta('/convertir');
  const { settings, update, reset } = useSettings();
  // Los sliders siguen respondiendo mientras la vista previa se recalcula.
  const deferredSettings = useDeferredValue(settings);

  const [phase, setPhase] = useState<Phase>('idle');
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [exportFailure, setExportFailure] = useState<Failure | null>(null);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);
  const [doneFile, setDoneFile] = useState<string | null>(null);

  const safeIndex = doc ? Math.min(sectionIndex, doc.sections.length - 1) : 0;
  const section = doc?.sections[safeIndex];

  // La negrita solo se recalcula si cambia la intensidad o el interruptor;
  // la tipografía y el tema se aplican como CSS, sin volver a transformar.
  const { intensity, bionicEnabled } = deferredSettings;
  const previewBody = useMemo(() => {
    if (!doc) return '';
    const current = doc.sections[Math.min(sectionIndex, doc.sections.length - 1)];
    if (!current) return '<p>Este documento no tiene texto que mostrar.</p>';
    return sectionBodyHtml(doc, current, { ...deferredSettings, intensity, bionicEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, sectionIndex, intensity, bionicEnabled]);
  const css = useMemo(() => previewCss(settings), [settings]);

  const handleFile = async (file: File) => {
    setPhase('reading');
    setFailure(null);
    setExportFailure(null);
    setDoneFile(null);
    setDoc(null);
    track('conversion_started');
    try {
      const parsed = await parseDocument(file);
      setDoc(parsed);
      setSectionIndex(0);
      setPhase('ready');
      track('format_imported', { format: parsed.kind });
    } catch (error) {
      setFailure(failureFrom(error, 'UNKNOWN'));
      setPhase('error');
    }
  };

  const handleExport = async () => {
    if (!doc) return;
    setPhase('exporting');
    setExportFailure(null);
    try {
      const result = await exportDocument(doc, settings);
      downloadBlob(result.blob, result.fileName);
      setExportWarnings(result.warnings);
      setDoneFile(result.fileName);
      setPhase('done');
      track('conversion_completed', { format: doc.kind, intensity: settings.intensity, bionic: settings.bionicEnabled });
      track('download_completed', { format: doc.kind });
    } catch (error) {
      // El documento se conserva: el usuario puede ajustar y reintentar.
      setExportFailure(failureFrom(error, 'EXPORT_FAILED'));
      setPhase('ready');
    }
  };

  const restart = () => {
    setDoc(null);
    setFailure(null);
    setExportFailure(null);
    setDoneFile(null);
    setPhase('idle');
  };

  const isWorking = phase === 'reading' || phase === 'exporting';
  const noun = doc?.kind === 'epub' ? 'EPUB' : 'PDF';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 space-y-4">
        <h1 className={sectionTitle}>Convertir a lectura biónica</h1>
        <p className="max-w-2xl text-ink-soft">
          Sube un EPUB o un PDF con texto seleccionable. Ajusta la lectura, revisa la vista previa y descarga el documento transformado.
        </p>
        <StepTracker current={STEP_BY_PHASE[phase]} />
      </header>

      {phase === 'idle' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section aria-labelledby="import-title" className="space-y-4">
            <h2 id="import-title" className="sr-only">
              Importar documento
            </h2>
            <Dropzone onFile={handleFile} />
            <div className={`${card} text-sm leading-relaxed text-ink-soft`}>
              <p className="font-semibold text-ink">Tu documento no sale de tu dispositivo</p>
              <p className="mt-1">
                El archivo se procesa en tu navegador. No lo subimos a ningún servidor ni lo guardamos. Solo se recuerdan tus ajustes visuales.
              </p>
              <p className="mt-3">
                ¿Tienes un PDF escaneado? Necesita OCR antes de convertirse; te lo indicaremos si ocurre.{' '}
                <Link className={linkBtn} to="/convertir-pdf-a-lectura-bionica">
                  Más sobre PDF
                </Link>
              </p>
            </div>
          </section>
          <aside className="space-y-4">
            <AdSlot label="Publicidad" />
          </aside>
        </div>
      )}

      {phase === 'reading' && (
        <div role="status" aria-live="polite" className={`${card} flex flex-col items-center gap-4 py-16 text-center`}>
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" aria-hidden="true" />
          <p className="text-lg font-semibold">Leyendo el documento…</p>
          <p className="max-w-md text-sm text-ink-soft">
            Extraemos el texto en tu dispositivo. Los PDF grandes pueden tardar unos segundos.
          </p>
        </div>
      )}

      {phase === 'error' && failure && (
        <div className="space-y-6">
          <Alert tone="error" title="No se ha podido convertir este documento">
            <p>{failure.message}</p>
            <p className="mt-2 text-xs opacity-80">Código: {failure.code}</p>
          </Alert>
          <Dropzone onFile={handleFile} />
          <button type="button" className={btnSecondary} onClick={restart}>
            Empezar de nuevo
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
                  {noun} · {doc.sections.length} {doc.kind === 'epub' ? 'secciones' : 'páginas con texto'}
                </p>
              </div>
              <button type="button" className={btnSecondary} onClick={restart}>
                Cambiar de documento
              </button>
            </div>

            {doc.sections.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`${btnSecondary} px-3`}
                  onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
                  disabled={safeIndex === 0}
                  aria-label="Sección anterior"
                >
                  ←
                </button>
                <label className="sr-only" htmlFor="section-select">
                  Elegir sección
                </label>
                <select
                  id="section-select"
                  value={safeIndex}
                  onChange={(e) => setSectionIndex(Number(e.target.value))}
                  className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                >
                  {doc.sections.map((s, i) => (
                    <option key={s.id} value={i}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`${btnSecondary} px-3`}
                  onClick={() => setSectionIndex((i) => Math.min(doc.sections.length - 1, i + 1))}
                  disabled={safeIndex >= doc.sections.length - 1}
                  aria-label="Sección siguiente"
                >
                  →
                </button>
              </div>
            )}

            <ReaderPreview
              body={previewBody}
              css={css}
              resetKey={`${doc.fileName}:${section?.id ?? ''}`}
              title={`Vista previa: ${section?.title ?? doc.title}`}
            />

            {doc.warnings.length > 0 && (
              <Alert tone="info" title="Avisos sobre el resultado">
                <ul className="list-disc space-y-1 pl-5">
                  {doc.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </section>

          <aside className="space-y-6" aria-label="Personalizar y exportar">
            <div className={card}>
              <h2 className="mb-4 text-base font-semibold">Personalizar lectura</h2>
              <SettingsPanel settings={settings} onChange={update} onReset={reset} />
            </div>

            <div className={`${card} space-y-4`}>
              <h2 className="text-base font-semibold">Descargar</h2>
              <p className="text-sm leading-relaxed text-ink-soft">
                {doc.kind === 'epub'
                  ? 'Genera un EPUB con el texto transformado. Conserva capítulos, imágenes y la estructura original, e incluye tu tipografía elegida.'
                  : 'Genera un PDF reformateado a partir del texto extraído. Es una reconstrucción: no es una copia idéntica del original.'}
              </p>
              {exportFailure && (
                <Alert tone="error" title="No se ha podido generar el archivo">
                  <p>{exportFailure.message}</p>
                  <p className="mt-1 text-xs opacity-80">Código: {exportFailure.code}</p>
                </Alert>
              )}
              <button type="button" className={`${btnPrimary} w-full`} onClick={handleExport} disabled={isWorking}>
                {phase === 'exporting' ? 'Generando archivo…' : `Descargar ${noun} transformado`}
              </button>
              {phase === 'done' && doneFile && (
                <Alert tone="success" title="Descarga iniciada">
                  <p className="break-all">{doneFile}</p>
                  {exportWarnings.length > 0 && (
                    <ul className="mt-2 list-disc pl-5">
                      {exportWarnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}
                </Alert>
              )}
            </div>

            <AdSlot label="Publicidad" />
          </aside>
        </div>
      )}
    </div>
  );
}
