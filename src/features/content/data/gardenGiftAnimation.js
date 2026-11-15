// Choreography follows the five caption beats. Every movement settles before
// the next one; independent properties may animate together (walk + position).
export function gardenGiftAnimation(pageIndex, slot) {
  const prefix = `garden-gift-${pageIndex + 1}-${slot.id}`;
  const clips = [];
  const preset = (name, startMs, durationMs, params = {}) => clips.push({
    id: `${prefix}-${name}-${startMs}`, targetId: slot.id, kind: "preset",
    preset: name, startMs, durationMs, params, easing: "ease-in-out",
  });
  const frames = (name, startMs, durationMs, property, values) => clips.push({
    id: `${prefix}-${name}`, targetId: slot.id, kind: "keyframes", startMs, durationMs,
    keyframes: values.map((value, index) => ({
      id: `${prefix}-${name}-frame-${index + 1}`,
      timeMs: Math.round(index * durationMs / (values.length - 1)),
      [property]: value, easing: "ease-in-out",
    })),
  });
  const x = Number(slot.x);
  const y = Number(slot.y);
  const scale = Number(slot.scale);
  const turns = [6, -5, 4, -4, 3];
  const routes = [
    [x - 7, x, x + 5, x + 8], // Follow the leaf into the garden.
    [x, x + 3, x - 5, x + 2], // Approach, step back, then leave space.
    [x, x - 4, x - 7, x - 7], // Slow down beside the seedling.
    [x, x - 5, x - 2, x - 2], // Shelter the plant, then ease back.
    [x - 6, x, x + 2, x + 2], // Come home and settle down.
  ][pageIndex];

  preset("appear", 0, 1000);
  // Establish the entry position without a jump when walking starts.
  frames("entry-position", 0, 1000, "x", [routes[0], routes[0]]);
  [2200, 24500, 47000].forEach((startMs, index) => {
    if (routes[index] === routes[index + 1]) return;
    frames(`step-${index + 1}`, startMs, 3200, "x", [routes[index], routes[index + 1]]);
    preset("walk", startMs, 3200);
  });
  frames("curious-look", 8000, 2400, "rotation", [0, turns[pageIndex], 0]);
  if (pageIndex < 2) {
    preset("jump", 12500, 1600, { distance: pageIndex === 0 ? 3 : 5 });
  } else {
    frames("gentle-nod", 12500, 2400, "rotation", [0, -4, 3, 0]);
  }
  frames("quiet-breath", 16500, 4800, "scale", [scale, scale * 1.025, scale, scale * 1.025, scale]);
  frames("listen", 31000, 2200, "rotation", [0, -turns[pageIndex], 0]);
  frames("inspect", 35500, 3000, "y", [y, y + 1.5, y]);
  frames("happy-sway", 40700, 2600, "rotation", [0, 3, -3, 0]);
  frames("settle", 52000, 4500, "scale", [scale, scale * 1.02, scale]);
  return clips;
}
