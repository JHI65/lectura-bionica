// Zona de carga accesible: arrastrar, o pulsar/teclear para elegir archivo.
import { useState, type DragEvent } from 'react';
import { useI18n } from '../i18n/useI18n';
import { config } from '../lib/state/config';

interface Props {
  onFile: (file: File) => void;
  /** Si se indica, se usa en lugar de onFile y permite elegir varios archivos (lotes). */
  onFiles?: (files: File[]) => void;
  /** Límite que se muestra en la etiqueta (por defecto, el del plan gratuito). */
  maxMb?: number;
  disabled?: boolean;
  accept?: string;
}

export function Dropzone({ onFile, onFiles, maxMb = config.maxFileMb, disabled = false, accept = '.epub,.pdf,application/epub+zip,application/pdf' }: Props) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    deliver(Array.from(event.dataTransfer.files ?? []));
  };

  const deliver = (files: File[]) => {
    if (files.length === 0) return;
    if (onFiles) onFiles(files);
    else onFile(files[0]);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 ${
        dragging ? 'border-brand bg-brand-soft' : 'border-slate-300 bg-white hover:border-brand'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        multiple={Boolean(onFiles)}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          deliver(files);
        }}
        aria-label={t.dropzone.aria}
      />
      <span className="text-lg font-semibold text-ink">{t.dropzone.title}</span>
      <span className="text-sm text-ink-soft">{t.dropzone.hint}</span>
      <span className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-ink-soft">{t.dropzone.chip(maxMb)}</span>
    </label>
  );
}
