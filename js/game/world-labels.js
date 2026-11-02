/** World-space label layout. Rendering and tests share these exact rectangles. */
export const LABEL_GAP = 12;
export const overlaps = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x
  && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
export const pixelTextWidth = value => String(value).length * 12 - 2;

export function wrapSign(value, limit = 22) {
  const lines = [''];
  for (const token of String(value).toUpperCase().split(/\s+/)) {
    // Split long words too: panel width must never depend on unbounded input.
    const words = token.match(new RegExp(`.{1,${limit}}`, 'g')) || [];
    for (const word of words) {
      const last = lines.length - 1;
      if (lines[last] && `${lines[last]} ${word}`.length > limit) lines.push(word);
      else lines[last] += `${lines[last] ? ' ' : ''}${word}`;
    }
  }
  return lines;
}

/** Nearby saved positions remain intact; only their decorative flags are clustered. */
export function checkpointGroups(level) {
  const groups = [];
  for (const cp of [...(level.checkpoints || [])].sort((a, b) => a.x - b.x)) {
    // Terminals already communicate their own safe restart; don't put a flag on the console.
    if ((level.gates || []).some(g => Math.abs(g.x - cp.x) < 180)) continue;
    const group = groups.at(-1);
    if (group && cp.x - group.members[0].x < 150) group.members.push(cp);
    else groups.push({ members: [cp] });
  }
  return groups.map(group => {
    const anchor = group.members.find(cp => cp.id.startsWith('parkour-')) || group.members[0];
    return { ...anchor, members: group.members.map(cp => cp.id), bounds: { x: anchor.x - 20, y: anchor.y - 10, w: 60, h: 84 } };
  });
}

/** Stable world anchors, never camera-following panels or per-frame shuffling. */
export function planWorldLabels(level) {
  const flags = checkpointGroups(level);
  const obstacles = [
    ...flags.map(flag => flag.bounds),
    ...(level.platforms || []).map(p => ({ x: p.x, y: p.y - 18, w: p.w, h: p.h + 18 })),
    ...(level.collectibles || []).map(c => ({ x: c.x - 16, y: c.y - 20, w: 32, h: 40 })),
    ...(level.gates || []).map(g => ({ x: g.x - 170, y: 270, w: 240, h: 198 })),
    ...(level.keyDoor ? [{ x: level.keyDoor.x - 190, y: 240, w: 410, h: 230 }] : []),
    ...(level.exit ? [{ x: level.exit.x - 170, y: level.exit.y - 80, w: 340, h: 160 }] : []),
  ];
  const panels = [], hidden = [];
  const place = (item, kind, lines, preferredY) => {
    // Text is presented at fixed CSS size in contextual help; world plaques are compact markers.
    const w = 34, h = 30;
    for (const y of [preferredY, 218, 150, 112]) {
      for (const dx of [0, -80, 80, -160, 160]) {
        const bounds = { x: Math.round((item.x + dx - w / 2) / 2) * 2, y, w, h };
        if (bounds.x < 16 || bounds.x + w > level.width - 16 || y < 108 || y + h > 342) continue;
        if ([...obstacles, ...panels.map(p => p.bounds)].some(other => overlaps(bounds, other, LABEL_GAP))) continue;
        panels.push({ kind, item, lines, bounds }); return;
      }
    }
    hidden.push({ kind, item });
  };
  // Instructions get priority. Saved status is secondary and can fall back to the gold flag.
  for (const item of level.signs || []) place(item, 'sign', wrapSign(item.text), 278);
  for (const item of flags) place(item, 'checkpoint', ['TERSIMPAN'], 328 - 30);
  return { flags, panels, obstacles, hidden };
}

/** Cull whole panels instead of clipping text or moving a panel into another object. */
export function visibleWorldPanels(layout, { camera = 0, player, checkpoint }) {
  const body = player ? { x: player.x - 24, y: player.y + player.h - 104, w: player.w + 48, h: 110 } : null;
  return layout.panels.filter(panel => panel.bounds.x >= camera + 12 && panel.bounds.x + panel.bounds.w <= camera + 948
    && (!body || !overlaps(panel.bounds, body, LABEL_GAP))
    && (panel.kind !== 'checkpoint' || panel.item.members.includes(checkpoint)));
}
