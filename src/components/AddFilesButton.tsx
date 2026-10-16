// Botón para añadir más archivos (varios a la vez) a una conversión ya empezada.
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
