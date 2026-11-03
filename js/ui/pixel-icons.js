// Pixel sprites prepared from the user's ZIPs; see assets/ui/manifest.json.
const names = new Set(['heart-full', 'heart-empty', 'gold', 'silver', 'bronze',
  'speaker', 'muted', 'play', 'settings', 'back', 'leaderboard', 'music', 'home']);

/** Decorative images never replace a control's text or accessible name. */
export function createPixelIcon(name) {
  if (!names.has(name)) throw new RangeError(`Unknown pixel icon: ${name}`);
  const image = document.createElement('img');
  image.src = new URL(`../../assets/ui/${name}.png`, import.meta.url).href;
  image.alt = ''; image.setAttribute('aria-hidden', 'true'); image.draggable = false;
  image.width = image.height = name.startsWith('heart-') ? 16 : 32;
  image.dataset.icon = name; image.className = 'pixel-icon';
  // An unavailable ornament must not block loading, controls, or readable text.
  image.addEventListener('error', () => { image.hidden = true; }, { once: true });
  return image;
}
