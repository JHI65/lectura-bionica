// Descarga de un Blob generado en el navegador (nunca pasa por servidor).

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Liberar tras un tick para que el navegador inicie la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
