// Original 16×16 artwork. Decorative only; labels and rank numbers stay in HTML.
export function createPixelIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.dataset.icon = name; svg.classList.add('pixel-icon');
  const medal = {
    gold: ['#e8b85b', '#fff0b0', '#936336'],
    silver: ['#aebfcd', '#e4efed', '#596b84'],
    bronze: ['#bb805b', '#f1c08a', '#744c44'],
  }[name];
  let artwork;
  if (medal) {
    const [base, light, shade] = medal;
    artwork = `<path fill="#782c40" d="M3 8h4v8l-2-2-2 2zm6 0h4v8l-2-2-2 2z"/>
      <path fill="#141521" d="M5 0h6v1h2v2h1v6h-1v2h-2v1H5v-1H3V9H2V3h1V1h2z"/>
      <path fill="${base}" d="M5 1h6v1h2v7h-2v2H5V9H3V3h2z"/>
      <path fill="${light}" d="M5 2h6v1H5zM4 3h1v5H4zM7 4h2v2h2v1H9v2H7V7H5V6h2z"/>
      <path fill="${shade}" d="M11 3h1v5h-1zM5 9h6v1H5z"/>`;
  } else {
    artwork = `<path fill="#dbe4de" d="M1 6h3V4h2V2h2v12H6v-2H4v-2H1z"/>
      <path fill="${name === 'muted' ? '#f18e93' : '#91d474'}" d="${name === 'muted'
        ? 'M10 5h2v2h1V5h2v2h-1v2h1v2h-2V9h-1v2h-2V9h1V7h-1z'
        : 'M10 5h1v1h1v4h-1v1h-1V9h1V7h-1zM13 2h1v2h1v8h-1v2h-1v-3h1V5h-1z'}"/>`;
  }
  // Whitespace in decorative SVG must not change a rank cell's text content.
  svg.innerHTML = artwork.replace(/>\s+</g, '><');
  return svg;
}
