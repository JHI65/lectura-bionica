// Conversión por lotes. Aplica los mismos ajustes a todos los archivos, los
// convierte uno tras otro y entrega un ZIP. Sin vista previa: para afinar los
// ajustes se puede convertir primero un archivo suelto.
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Alert } from './Alert';
import { SettingsPanel } from './SettingsPanel';
import { AddFilesButton } from './AddFilesButton';
import { DocumentPreview } from './DocumentPreview';
import { btnPrimary, btnSecondary, card } from './ui';
import { useI18n } from '../i18n/useI18n';
import { runBatch, zipOutputs, type BatchItem } from '../lib/batch';
import type { ReadingSettings } from '../lib/bionic/settings';
import type { ParsedDocument } from '../lib/document';
import { toConversionError, type ConversionError } from '../lib/files/errors';
import { downloadBlob } from '../lib/download';
import { formatBytes } from '../lib/files/validate';
import { track } from '../lib/state/analytics';

interface Props {
  files: File[];
  maxBytes: number;
  settings: ReadingSettings;
  onChange: ComponentProps<typeof SettingsPanel>['onChange'];
  onReset: () => void;
  onExit: () => void;
  /** Añade más archivos al lote (solo antes de empezar). */
  onAdd: (files: File[]) => void;
  /** Quita un archivo del lote. */
  onRemove: (index: number) => void;
}

type Phase = 'setup' | 'running' | 'done';

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; doc: ParsedDocument; key: string }
  | { status: 'error'; error: ConversionError };

const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
const PREVIEW_CACHE = 3;

export function BatchConverter({ files, maxBytes, settings, onChange, onReset, onExit, onAdd, onRemove }: Props) {
  const { t, locale, numberLocale } = useI18n();
  const b = t.batch;
  const [phase, setPhase] = useState<Phase>('setup');
  const [items, setItems] = useState<BatchItem[]>(() => files.map((f) => ({ name: f.name, status: 'pending' })));
  const [zip, setZip] = useState<{ blob: Blob; name: string } | null>(null);
  const [zipError, setZipError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Vista previa del archivo elegido. Se guardan los últimos documentos leídos para
  // poder pasar de uno a otro sin volver a procesarlos, pero solo unos pocos (memoria).
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' });
  const cache = useRef(new Map<string, ParsedDocument>());
  const selectedIndex = Math.min(selected, files.length - 1);
  const selectedFile = files[selectedIndex];

  useEffect(() => {
    // Mientras se convierte no se lee otro documento: se evita competir por CPU y memoria.
    if (phase === 'running' || !selectedFile) return;
    const key = fileKey(selectedFile);
    const cached = cache.current.get(key);
    if (cached) {
      cache.current.delete(key);
      cache.current.set(key, cached); // el más reciente al final
      setPreview({ status: 'ready', doc: cached, key });
      return;
    }
    const controller = new AbortController();
    setPreview({ status: 'loading' });
    void (async () => {
      try {
        const { parseDocument } = await import('../lib/convert');
        const doc = await parseDocument(selectedFile, { signal: controller.signal, maxBytes });
        if (controller.signal.aborted) return;
        cache.current.set(key, doc);
        while (cache.current.size > PREVIEW_CACHE) cache.current.delete(cache.current.keys().next().value as string);
        setPreview({ status: 'ready', doc, key });
      } catch (error) {
        if (!controller.signal.aborted) setPreview({ status: 'error', error: toConversionError(error, 'UNKNOWN') });
      }
    })();
    return () => controller.abort();
  }, [selectedFile, phase, maxBytes]);

  // Si se añaden archivos antes de empezar, la lista se actualiza.
  useEffect(() => {
    if (phase === 'setup') setItems(files.map((f) => ({ name: f.name, status: 'pending' })));
  }, [files, phase]);

  const patchItem = (index: number, patch: Partial<BatchItem>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const start = async () => {
    if (phase === 'running') return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('running');
    setZip(null);
    setZipError(false);
    setItems(files.map((f) => ({ name: f.name, status: 'pending' })));
    track('batch_started', { count: files.length, lang: locale });

    const { parseDocument, exportDocument } = await import('../lib/convert');
    const outputs = await runBatch(files, {
      signal: controller.signal,
      onItem: patchItem,
      convert: async (file) => {
        const doc = await parseDocument(file, { signal: controller.signal, maxBytes });
        return exportDocument(doc, settings, { signal: controller.signal, locale });
      },
    });
    abortRef.current = null;

    if (outputs.length > 0) {
      try {
        const name = b.zipName(outputs.length);
        const blob = await zipOutputs(outputs);
        setZip({ blob, name });
        downloadBlob(blob, name);
        track('batch_completed', { count: outputs.length, lang: locale });
      } catch {
        setZipError(true);
      }
    }
    setPhase('done');
  };

  // Quitar un archivo: la lista vuelve a «preparado» (los estados anteriores ya no encajan).
  const remove = (index: number) => {
    if (index < selected) setSelected((n) => Math.max(0, n - 1));
    if (phase === 'done') {
      setPhase('setup');
      setZip(null);
      setZipError(false);
    }
    onRemove(index);
  };

  const done = items.filter((i) => i.status === 'done').length;
  const failed = items.filter((i) => i.status === 'error').length;
  const finished = items.filter((i) => i.status === 'done' || i.status === 'error' || i.status === 'cancelled').length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="batch-title" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="batch-title" className="text-lg font-semibold">
              {b.title}
            </h2>
            <p className="text-sm text-ink-soft">{b.summary(files.length, formatBytes(totalSize, numberLocale))}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase === 'setup' && <AddFilesButton onFiles={onAdd} />}
            <button type="button" className={btnSecondary} onClick={onExit} disabled={phase === 'running'}>
              {b.changeFiles}
            </button>
          </div>
        </div>

        <ul aria-label={b.listLabel} className={`${card} max-h-64 divide-y divide-slate-200 overflow-y-auto p-0`}>
          {items.map((item, index) => (
            <li key={`${item.name}:${index}`} className={`flex items-stretch ${index === selectedIndex ? 'bg-brand-soft' : ''}`}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-current={index === selectedIndex ? 'true' : undefined}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
              >
                <span className="min-w-0 flex-1 break-all font-medium">{item.name}</span>
                <span
                  className={
                    item.status === 'error' ? 'font-medium text-red-700' : item.status === 'done' ? 'font-medium text-emerald-700' : 'text-ink-soft'
                  }
                >
                  {b.status[item.status]}
                </span>
                {item.error && <span className="w-full text-xs text-red-700">{t.errors[item.error.code](item.error.params, numberLocale)}</span>}
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={phase === 'running'}
                aria-label={b.removeFile(item.name)}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-lg text-ink-soft transition hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>

        {selectedFile && (
          <div className="space-y-3" aria-live="polite">
            <h3 className="truncate text-base font-semibold">{b.previewOf(selectedFile.name)}</h3>
            {preview.status === 'loading' && (
              <p role="status" className="text-sm text-ink-soft">
                {phase === 'running' ? b.previewPaused : b.previewLoading}
              </p>
            )}
            {preview.status === 'error' && (
              <Alert tone="error" title={t.converter.errorTitle}>
                <p>{t.errors[preview.error.code](preview.error.params, numberLocale)}</p>
              </Alert>
            )}
            {preview.status === 'ready' && <DocumentPreview key={preview.key} doc={preview.doc} settings={settings} idSuffix="-batch" />}
          </div>
        )}
      </section>

      <aside className="space-y-6" aria-label={t.converter.settingsAria}>
        <div className={card}>
          <h2 className="mb-4 text-base font-semibold">{t.converter.settingsTitle}</h2>
          <SettingsPanel settings={settings} onChange={onChange} onReset={onReset} />
        </div>

        <div className={`${card} space-y-4`}>
          <h2 className="text-base font-semibold">{b.downloadTitle}</h2>
          {phase === 'setup' && (
            <>
              <p className="text-sm leading-relaxed text-ink-soft">{b.setupBody}</p>
              <button type="button" className={`${btnPrimary} w-full`} onClick={start}>
                {b.convertAll(files.length)}
              </button>
            </>
          )}
          {phase === 'running' && (
            <div role="status" aria-live="polite" className="space-y-3">
              <p className="text-sm font-medium">{b.working(Math.min(finished + 1, files.length), files.length)}</p>
              <progress className="h-2 w-full overflow-hidden rounded-full accent-brand" max={files.length} value={finished} aria-label={t.converter.progress} />
              <button type="button" className={btnSecondary} onClick={() => abortRef.current?.abort()}>
                {t.converter.cancel}
              </button>
            </div>
          )}
          {phase === 'done' && (
            <div className="space-y-3">
              {done > 0 && !zipError ? (
                <Alert tone="success" title={b.doneTitle}>
                  <p>{b.doneCount(done, files.length, failed)}</p>
                </Alert>
              ) : (
                <Alert tone="error" title={zipError ? b.zipFailedTitle : b.noneTitle}>
                  <p>{zipError ? b.zipFailedBody : b.noneBody}</p>
                </Alert>
              )}
              {zip && (
                <button type="button" className={`${btnPrimary} w-full`} onClick={() => downloadBlob(zip.blob, zip.name)}>
                  {b.zipAgain}
                </button>
              )}
              <button type="button" className={`${btnSecondary} w-full`} onClick={start}>
                {b.convertAgain}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
