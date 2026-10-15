// Polyfill de pruebas: jsdom no implementa Blob.arrayBuffer() (sí lo hacen
// todos los navegadores objetivo). Solo afecta a los tests.
if (typeof Blob !== 'undefined' && !('arrayBuffer' in Blob.prototype)) {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
  });
}

// jsdom tampoco implementa URLs de objeto (epub.js las usa para portadas).
if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => undefined;
}

// Node 25 expone un `localStorage` experimental sin métodos que pisa al de jsdom.
// Se sustituye por una implementación en memoria solo para las pruebas.
if (typeof window !== 'undefined' && typeof window.localStorage?.clear !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: memoryStorage });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage });
}
