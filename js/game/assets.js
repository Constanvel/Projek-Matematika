/** Preload the local pixel atlas; high-resolution source poses are never runtime dependencies. */
export function loadAssets() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = new URL('../../assets/character/pixel/gundul-sheet.png', import.meta.url);
    const cleanup = () => { image.onload = null; image.onerror = null; };
    image.onload = () => {
      cleanup();
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Atlas pixel Gundul kosong atau rusak. Periksa aset lokal, lalu coba lagi.'));
        return;
      }
      resolve({ pixelAtlas: image });
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Gagal memuat atlas pixel Gundul (${url.pathname}). Periksa berkas lokal, lalu coba lagi.`));
    };
    image.src = url.href;
  });
}
