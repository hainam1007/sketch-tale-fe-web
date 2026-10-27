import fs from "node:fs/promises";
import sharp from "sharp";

// Extract the supplied portraits by alpha connectivity rather than cutting
// a uniform grid, which would clip hair and include neighbouring portraits.
const source = "design/source/child-profiles/avatar-sheet.png";
const destination = "public/images/library/child-avatars";
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const labels = new Int32Array(width * height);
const queue = new Int32Array(width * height);
const components = [];
let label = 0;
for (let i = 0; i < labels.length; i++) {
  if (labels[i] || data[i * 4 + 3] < 100) continue;
  label++;
  let head = 0, tail = 1, count = 0;
  let left = width, top = height, right = 0, bottom = 0;
  queue[0] = i;
  labels[i] = label;
  while (head < tail) {
    const p = queue[head++], x = p % width, y = Math.floor(p / width);
    count++;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
    for (const next of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
      if (next >= 0 && !labels[next] && data[next * 4 + 3] >= 100) {
        labels[next] = label;
        queue[tail++] = next;
      }
    }
  }
  if (count > 2000) components.push({ label, left, top, right, bottom });
}
components.sort((a, b) => Math.round(a.top / 340) - Math.round(b.top / 340) || a.left - b.left);
if (components.length !== 15) throw new Error(`Expected 15 source portraits, found ${components.length}`);
await fs.mkdir(destination, { recursive: true });
for (const [index, portrait] of components.slice(0, 12).entries()) {
  const left = Math.max(0, portrait.left - 3), top = Math.max(0, portrait.top - 3);
  const w = Math.min(width - left, portrait.right - left + 4);
  const h = Math.min(height - top, portrait.bottom - top + 4);
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = left + x, sy = top + y, p = sy * width + sx;
    let belongs = labels[p] === portrait.label;
    // Retain the original antialiased fringe next to this portrait only.
    for (let dy = -2; !belongs && dy <= 2; dy++) for (let dx = -2; !belongs && dx <= 2; dx++) {
      const nx = sx + dx, ny = sy + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && labels[ny * width + nx] === portrait.label) belongs = true;
    }
    if (belongs) data.copy(pixels, (y * w + x) * 4, p * 4, p * 4 + 4);
  }
  await sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
    .resize(352, 352, { fit: "contain", background: "#00000000" })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#00000000" })
    .png().toFile(`${destination}/child-${String(index + 1).padStart(2, "0")}.png`);
}
console.log(`Extracted 12 transparent avatars to ${destination}`);
