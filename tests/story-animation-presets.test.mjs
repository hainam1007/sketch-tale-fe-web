import test from "node:test";
import assert from "node:assert/strict";
import { ANIMATION_PRESETS } from "../src/features/content/utils/storyAnimationPresets.js";
import { clipsConflict, evaluateSlotAnimation } from "../src/features/content/utils/storyAnimation.js";

const slot = { id: "hero", x: 50, y: 50, scale: 1, rotation: 0 };
const base = { ...slot, opacity: 1 };
delete base.id;
const clipFor = (preset) => ({ id: preset, targetId: slot.id, kind: "preset", preset, startMs: 100, durationMs: 1000 });

test("every selectable effect animates only its declared properties and holds its final pose", () => {
  assert.equal(ANIMATION_PRESETS.length, 20);
  assert.equal(new Set(ANIMATION_PRESETS.map(({ id }) => id)).size, 20);
  for (const { id, properties } of ANIMATION_PRESETS) {
    const clip = clipFor(id);
    assert.deepEqual(evaluateSlotAnimation(slot, [clip], 99), base);
    const samples = Array.from({ length: 21 }, (_, i) => evaluateSlotAnimation(slot, [clip], 100 + i * 50));
    for (const property of Object.keys(base)) {
      assert.equal(samples.some((state) => Math.abs(state[property] - base[property]) > 0.001), properties.includes(property), `${id}: ${property}`);
    }
    for (const state of samples) {
      assert.ok(Object.values(state).every(Number.isFinite));
      assert.ok(state.scale > 0 && state.opacity >= 0 && state.opacity <= 1);
    }
    assert.deepEqual(samples.at(-1), evaluateSlotAnimation(slot, [clip], 5000));
    assert.deepEqual(evaluateSlotAnimation(slot, JSON.parse(JSON.stringify([clip])), 450), samples[7]);
  }
});

test("new effects reject overlapping property tracks but allow independent and adjacent clips", () => {
  for (const { id, properties } of ANIMATION_PRESETS) {
    const clip = clipFor(id);
    for (const property of Object.keys(base)) {
      const keyframe = { id: "keyframe", targetId: slot.id, kind: "keyframes", startMs: 100, durationMs: 1000, keyframes: [{ timeMs: 0, [property]: base[property] }] };
      assert.equal(clipsConflict([keyframe], clip), properties.includes(property), `${id}: ${property}`);
    }
    assert.equal(clipsConflict([clip], { ...clip, startMs: 1100 }), false);
    assert.equal(clipsConflict([clip], { ...clip, targetId: "other" }), false);
    assert.equal(clipsConflict([clip], clip, clip.id), false);
  }
});

test("temporary emphasis returns to rest; directional effects finish at the intended destination", () => {
  for (const id of ["pulse", "shake", "wobble", "float", "bounce", "nod", "sway"]) {
    assert.deepEqual(evaluateSlotAnimation(slot, [clipFor(id)], 1100), base);
  }
  for (const [id, property, expected] of [["slide-left", "x", 38], ["slide-up", "y", 38], ["slide-down", "y", 62], ["zoom-in", "scale", 1.3], ["zoom-out", "scale", 0.7], ["fade-out", "opacity", 0], ["spin-reverse", "rotation", -360]]) {
    assert.equal(evaluateSlotAnimation(slot, [clipFor(id)], 1100)[property], expected);
  }
});
