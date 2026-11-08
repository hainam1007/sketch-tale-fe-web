// Shared by the picker, page validation and timeline conflict detection.
export const ANIMATION_PRESETS = [
  { id: "appear", label: "Xuất hiện", description: "Hiện dần và phóng nhẹ", properties: ["opacity", "scale"], glyph: "✦" },
  { id: "move", label: "Di chuyển", description: "Lướt sang phải", properties: ["x"], glyph: "→" },
  { id: "jump", label: "Nhảy", description: "Bật lên rồi hạ xuống", properties: ["y"], glyph: "↟" },
  { id: "spin", label: "Xoay", description: "Quay một vòng", properties: ["rotation"], glyph: "↻" },
  { id: "walk", label: "Nhún bước", description: "Nhún nhịp nhàng tại chỗ", properties: ["y"], glyph: "♬" },
  { id: "fade-in", label: "Hiện dần", description: "Tăng dần độ rõ", properties: ["opacity"], glyph: "◕" },
  { id: "fade-out", label: "Mờ dần", description: "Mờ đi đến khi biến mất", properties: ["opacity"], glyph: "◌" },
  { id: "slide-left", label: "Trượt trái", description: "Di chuyển sang trái", properties: ["x"], glyph: "←" },
  { id: "slide-up", label: "Trượt lên", description: "Di chuyển lên trên", properties: ["y"], glyph: "↑" },
  { id: "slide-down", label: "Trượt xuống", description: "Di chuyển xuống dưới", properties: ["y"], glyph: "↓" },
  { id: "zoom-in", label: "Phóng to", description: "Tăng kích thước thêm 30%", properties: ["scale"], glyph: "+" },
  { id: "zoom-out", label: "Thu nhỏ", description: "Giảm kích thước đi 30%", properties: ["scale"], glyph: "−" },
  { id: "pulse", label: "Nhịp đập", description: "Phồng lên rồi trở lại", properties: ["scale"], glyph: "♡" },
  { id: "shake", label: "Rung ngang", description: "Rung qua lại thật nhanh", properties: ["x"], glyph: "↔" },
  { id: "wobble", label: "Lắc lư", description: "Nghiêng trái rồi nghiêng phải", properties: ["rotation"], glyph: "∿" },
  { id: "float", label: "Lơ lửng", description: "Nhẹ nhàng lên rồi xuống", properties: ["y"], glyph: "↕" },
  { id: "bounce", label: "Nảy bóng", description: "Nảy ba lần thấp dần", properties: ["y"], glyph: "⌁" },
  { id: "nod", label: "Gật gù", description: "Cúi nhẹ theo hai nhịp", properties: ["rotation"], glyph: "⤵" },
  { id: "spin-reverse", label: "Xoay ngược", description: "Quay ngược một vòng", properties: ["rotation"], glyph: "↺" },
  { id: "sway", label: "Đung đưa", description: "Trôi ngang qua lại nhẹ nhàng", properties: ["x"], glyph: "~" },
];

export const ANIMATION_PRESET_BY_ID = Object.fromEntries(ANIMATION_PRESETS.map((preset) => [preset.id, preset]));
