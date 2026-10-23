export function profileIndex(id = "") {
  return (
    [...String(id)].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    6
  );
}
export function ageLabel(value) {
  const digits = String(value || "").match(/\d+/g);
  return digits?.length
    ? `${digits.join("–")} tuổi`
    : value || "Khám phá theo nhịp của bé";
}

export function savedAvatar(userId, childId, fallback) {
 try { const index = JSON.parse(sessionStorage.getItem(`sketchtale.parent-demo.v2:${userId}:${childId}`))?.avatar; return Number.isInteger(index) && index >= 0 && index < 6 ? index : fallback; } catch { return fallback; }
}
