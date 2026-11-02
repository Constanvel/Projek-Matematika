import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../js/data/levels.js';
import { LABEL_GAP, overlaps, wrapSign, planWorldLabels, visibleWorldPanels } from '../js/game/world-labels.js';

test('world plaques reserve shared clear space from flags, terrain, coins and machines', () => {
  for (const level of levels) {
    const layout = planWorldLabels(level);
    assert.deepEqual(layout, planWorldLabels(level), 'deterministic anchors');
    for (let i = 0; i < layout.panels.length; i++) {
      const { bounds } = layout.panels[i];
      for (const other of [...layout.obstacles, ...layout.panels.slice(i + 1).map(p => p.bounds)]) {
        assert.equal(overlaps(bounds, other, LABEL_GAP), false, `${level.id}: panel collision`);
      }
      assert.ok(bounds.y >= 108 && bounds.y + bounds.h <= 342);
    }
    for (const route of level.parkour) {
      assert.ok(layout.panels.some(p => p.kind === 'sign' && p.item.x === route.start), `${route.id}: takeoff instruction retained`);
      const flag = layout.flags.find(f => f.members.includes(route.checkpointId));
      assert.ok(flag, `${route.id}: visible route flag`);
      assert.equal(layout.flags.filter(f => Math.abs(f.x - route.start) < 150).length, 1, 'no duplicate nearby flags');
    }
  }
});

test('checkpoint clustering is decorative and never mutates saved positions', () => {
  for (const level of levels) {
    const before = JSON.stringify(level.checkpoints);
    const layout = planWorldLabels(level);
    assert.equal(JSON.stringify(level.checkpoints), before);
    for (const flag of layout.flags) {
      for (const id of flag.members) {
        assert.ok(level.checkpoints.some(cp => cp.id === id));
        const panels = visibleWorldPanels(layout, { camera: Math.max(0, flag.x - 400), checkpoint: id });
        assert.ok(panels.filter(p => p.kind === 'checkpoint').every(p => p.item.members.includes(id)));
      }
    }
  }
});

test('camera and airborne player never clip or obscure visible panels', () => {
  let count = 0;
  for (const level of levels) {
    const layout = planWorldLabels(level);
    for (let camera = 0; camera <= level.width - 960; camera += 80) {
      for (const y of [380, 300, 220, 140]) {
        const player = { x: camera + 400, y, w: 34, h: 70 };
        const visible = visibleWorldPanels(layout, { camera, player, checkpoint: level.parkour[0].checkpointId });
        for (const panel of visible) {
          count++;
          assert.ok(panel.bounds.x >= camera + 12 && panel.bounds.x + panel.bounds.w <= camera + 948);
          assert.equal(overlaps(panel.bounds, { x: player.x - 24, y: y - 34, w: 82, h: 110 }, LABEL_GAP), false);
        }
      }
    }
  }
  assert.ok(count > 100);
});

test('unbounded sign text wraps and congested secondary labels yield instead of colliding', () => {
  assert.ok(wrapSign('X'.repeat(100)).every(line => line.length <= 22));
  const layout = planWorldLabels({ width: 960, platforms: [], signs: Array.from({ length: 30 }, (_, i) => ({ x: 480, text: `PAPAN NOMOR ${i}` })) });
  assert.ok(layout.hidden.length > 0);
  layout.panels.forEach((panel, index) => layout.panels.slice(index + 1).forEach(other => assert.equal(overlaps(panel.bounds, other.bounds, LABEL_GAP), false)));
});
