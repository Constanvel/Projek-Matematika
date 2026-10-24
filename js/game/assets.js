const POSES = [
  'posturkanan', 'posturkiri', 'posturdepan',
  'posturberjalan', 'posturberlari', 'posturmelambai',
];

/** Load the normalized PNGs, retaining their shared (224, 528) foot anchor. */
export function loadAssets() {
  return Promise.all(POSES.map(name => new Promise((resolve, reject) => {
    const image = new Image();
    const url = new URL(`../../assets/character/processed/${name}.png`, import.meta.url);
    image.onload = () => {
      image.onload = null;
      image.onerror = null;
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error(`Gambar karakter ${name}.png kosong atau rusak. Muat ulang permainan.`));
        return;
      }
      resolve([name, image]);
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Gagal memuat karakter ${name}.png (${url.pathname}). Periksa berkas aset dan koneksi, lalu muat ulang permainan.`));
    };
    image.src = url.href;
  }))).then(entries => Object.fromEntries(entries));
}
