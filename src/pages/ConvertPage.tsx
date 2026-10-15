import { Converter } from '../components/Converter';
import { sectionTitle } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

// /convertir (solo español): la misma herramienta que la portada. En inglés no
// existe: la portada ya es el conversor.
export function ConvertPage() {
  useDocumentMeta();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 space-y-4">
        <h1 className={sectionTitle}>Convertir a lectura biónica</h1>
        <p className="max-w-2xl text-ink-soft">
          Sube un EPUB o un PDF con texto seleccionable. Ajusta la lectura, revisa la vista previa y descarga el documento transformado.
        </p>
      </header>
      <Converter />
    </div>
  );
}
