// Vista previa aislada y en tiempo real.
//
// Seguridad: sandbox="allow-same-origin" SIN allow-scripts. El contenido no
// puede ejecutar código (ni scripts ni manejadores, que además se eliminan al
// sanitizar), pero la app sí puede actualizar el documento sin recargarlo.
// Así cada ajuste se ve al instante y se conserva la posición de lectura.
import { useEffect, useMemo, useRef } from 'react';
import { buildPreviewDocument } from '../lib/preview';

interface Props {
  body: string;
  css: string;
  title: string;
  /** Idioma del documento de la vista previa (atributo lang). */
  lang?: string;
  /** Cambia al cambiar de documento o sección: entonces sí se recrea el iframe. */
  resetKey: string;
  minHeight?: string;
}

function applyContent(frame: HTMLIFrameElement | null, body: string, css: string): void {
  const doc = frame?.contentDocument;
  if (!doc?.body) return;

  // Posición relativa, porque la altura cambia con la tipografía.
  const scroller = doc.scrollingElement ?? doc.documentElement;
  const range = scroller.scrollHeight - scroller.clientHeight;
  const ratio = range > 0 ? scroller.scrollTop / range : 0;

  const style = doc.getElementById('reader-style');
  if (style && style.textContent !== css) style.textContent = css;
  if (doc.body.innerHTML !== body) doc.body.innerHTML = body;

  const newRange = scroller.scrollHeight - scroller.clientHeight;
  scroller.scrollTop = Math.round(ratio * Math.max(0, newRange));
}

export function ReaderPreview({ body, css, title, resetKey, lang = 'es', minHeight = '70vh' }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ body, css });
  latest.current = { body, css };

  // El documento inicial solo se genera al cambiar de sección.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialDocument = useMemo(() => buildPreviewDocument(latest.current.body, latest.current.css, lang), [resetKey]);

  useEffect(() => {
    applyContent(frameRef.current, body, css);
  }, [body, css]);

  return (
    <iframe
      key={resetKey}
      ref={frameRef}
      title={title}
      srcDoc={initialDocument}
      sandbox="allow-same-origin"
      referrerPolicy="no-referrer"
      // Si el usuario cambió algo mientras cargaba, se aplica lo último.
      onLoad={() => applyContent(frameRef.current, latest.current.body, latest.current.css)}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-inner"
      style={{ minHeight, height: '100%' }}
    />
  );
}
