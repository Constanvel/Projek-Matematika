import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../js/data/levels.js';
import { GameEngine } from '../js/game/engine.js';

// Unlike geometry-only checks this runs spring, ice, crumble timers and checkpoint logic together.
test('every authored course works through the live engine including regional surfaces', () => {
  const progress = { solved: levels.flatMap(l => l.questionIds), keys: [0, 1, 2], collected: [] };
  for (const level of levels) {
    for (const route of level.parkour) {
      for (const delay of [0, 5, 10, 15]) {
        let fell = false;
        const engine = new GameEngine({ canvas: { getContext: () => ({}) }, level, checkpoint: route.checkpointId,
          getProgress: () => ({ ...progress, checkpoint: route.checkpointId }), onFall: () => { fell = true; } });
        engine.respawn(route.checkpointId);
        let next = 0, hold = 0;
        engine.input.sample = () => {
          const timed = engine.player.grounded && next < route.jumps.length && engine.player.x >= route.jumps[next].x + delay;
          if (timed) { next++; hold = 25; }
          const input = { axis: 1, jumpPressed: timed, jumpHeld: hold > 0 };
          hold = Math.max(0, hold - 1);
          return input;
        };
        for (let frame = 0; frame < 1800 && !fell; frame++) {
          engine.update();
          if (engine.player.x >= route.end && engine.player.grounded) break;
        }
        assert.equal(fell, false, `${route.id}: no fall with ${delay}px launch delay`);
        assert.ok(engine.player.x >= route.end && engine.player.grounded, `${route.id}: live engine completes`);
        assert.equal(next, route.jumps.length, `${route.id}: every takeoff consumed`);
      }
    }
  }
});
