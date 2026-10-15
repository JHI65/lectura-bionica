// Apertura y cierre de libros con epub.js.
//
// epub.js, para un EPUB comprimido, crea por defecto una URL de blob por cada
// recurso (todas las imágenes) y lo hace de forma asíncrona. Aquí no renderizamos
// el libro, así que se desactiva ('none') y se espera a `opened`, que garantiza
// que no queda trabajo pendiente antes de destruirlo.
import ePub from 'epubjs';

export type EpubBook = ReturnType<typeof ePub>;

export async function openBook(buffer: ArrayBuffer): Promise<EpubBook> {
  const book = ePub(buffer, { replacements: 'none' });
  try {
    await book.opened;
  } catch (error) {
    disposeBook(book);
    throw error;
  }
  return book;
}

/** Libera el libro y revoca cualquier URL de blob que epub.js haya creado. */
export function disposeBook(book: EpubBook): void {
  try {
    const resources = (book as unknown as { resources?: { replacementUrls?: unknown } }).resources;
    const urls = resources?.replacementUrls;
    if (Array.isArray(urls)) {
      for (const url of urls) {
        if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
      }
    }
  } catch {
    // La limpieza nunca debe romper la conversión.
  }
  book.destroy();
}
