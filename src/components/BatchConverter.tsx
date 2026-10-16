// Conversión por lotes. Aplica los mismos ajustes a todos los archivos, los
// convierte uno tras otro y entrega un ZIP. Sin vista previa: para afinar los
// ajustes se puede convertir primero un archivo suelto.
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Alert } from './Alert';
import { SettingsPanel } from './SettingsPanel';
import { AddFilesButton } from './AddFilesButton';
import { btnPrimary, btnSecondary, card } from './ui';
import { useI18n } from '../i18n/useI18n';
import { runBatch, zipOutputs, type BatchItem } from '../lib/batch';
import type { ReadingSettings } from '../lib/bionic/settings';
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
}

type Phase = 'setup' | 'running' | 'done';

export function BatchConverter({ files, maxBytes, settings, onChange, onReset, onExit, onAdd }: Props) {
  const { t, locale, numberLocale } = useI18n();
  const b = t.batch;
  const [phase, setPhase] = useState<Phase>('setup');
  const [items, setItems] = useState<BatchItem[]>(() => files.map((f) => ({ name: f.name, status: 'pending' })));
  const [zip, setZip] = useState<{ blob: Blob; name: string } | null>(null);
  const [zipError, setZipError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

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

        <ul className={`${card} divide-y divide-slate-200 p-0`}>
          {items.map((item, index) => (
            <li key={`${item.name}:${index}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 break-all font-medium">{item.name}</span>
              <span
                className={
                  item.status === 'error' ? 'font-medium text-red-700' : item.status === 'done' ? 'font-medium text-emerald-700' : 'text-ink-soft'
                }
              >
                {b.status[item.status]}
              </span>
              {item.error && <span className="w-full text-xs text-red-700">{t.errors[item.error.code](item.error.params, numberLocale)}</span>}
            </li>
          ))}
        </ul>
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
