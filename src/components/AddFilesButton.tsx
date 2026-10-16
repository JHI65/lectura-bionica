// Botón para añadir más archivos (varios a la vez) a una conversión ya empezada.
import { useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import { btnSecondary } from './ui';

export function AddFilesButton({ onFiles, disabled = false }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <label className={`${btnSecondary} cursor-pointer focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {t.batch.addMore}
      <input
        type="file"
        multiple
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
    </label>
  );
}

/** Fila para soltar más documentos (o pulsar para elegirlos), pensada para ir al final de una lista. */
export function DropMoreRow({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length > 0) onFiles(files);
      }}
      className={`flex min-h-[3.5rem] cursor-pointer flex-wrap items-center justify-center gap-x-2 border-t-2 border-dashed px-4 py-2 text-center text-sm transition focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand ${
        dragging ? 'border-brand bg-brand-soft' : 'border-slate-300 bg-slate-50 hover:border-brand'
      }`}
    >
      <span className="font-medium text-ink">{t.batch.dropMore}</span>
      <span className="text-ink-soft">{t.batch.dropMoreHint}</span>
      <input
        type="file"
        multiple
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        className="sr-only"
        aria-label={t.batch.addMore}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
    </label>
  );
}
