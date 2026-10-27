const labels = [
  "Áo xanh ngôi sao", "Nơ hồng", "Áo xanh lá", "Hoa cài tóc xanh",
  "Mũ xanh và kính", "Tóc búi ngôi sao", "Mũ xanh đội ngược", "Băng đô vàng",
  "Áo cam tóc xoăn", "Tóc hồng cài hoa", "Tai nghe âm nhạc", "Mũ cói cài hoa",
];

export const childAvatars = labels.map((label, index) => ({
  id: `child-${String(index + 1).padStart(2, "0")}`,
  label,
  src: `/images/library/child-avatars/child-${String(index + 1).padStart(2, "0")}.png`,
}));
export const CHILD_AVATAR_COUNT = childAvatars.length;
