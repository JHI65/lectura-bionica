// Zona de carga accesible: arrastrar, o pulsar/teclear para elegir archivo.
import { useState, type DragEvent } from 'react';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

export function Dropzone({ onFile, disabled = false, accept = '.epub,.pdf,application/epub+zip,application/pdf' }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
        aria-label="Seleccionar documento EPUB o PDF"
      />
      <span className="text-lg font-semibold text-ink">Arrastra tu EPUB o PDF aquí</span>
      <span className="text-sm text-ink-soft">o pulsa para elegir un archivo desde tu dispositivo</span>
      <span className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-ink-soft">EPUB o PDF con texto seleccionable</span>
    </label>
  );
}
