import { useState } from "react";
export function useParentDemo(userId, childId = "family") {
  const key = `sketchtale.parent-demo.v2:${userId}:${childId}`;
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  });
  function update(patch) {
    setData((current) => {
      const next = { ...current, ...patch };
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* The demo still works in memory when storage is unavailable. */
      }
      return next;
    });
  }
  return [data, update];
}
export const demoBooks = [
  {
    id: "garden",
    title: "Khu vườn của những người bạn",
    image: "/images/seed.webp",
    topic: "Thiên nhiên",
    progress: 65,
  },
  {
    id: "rabbit",
    title: "Chú thỏ và món quà nhỏ",
    image: "/images/rabbit.webp",
    topic: "Lòng tốt",
    progress: 100,
  },
  {
    id: "stars",
    title: "Một chuyến đi tới các vì sao",
    image: "/images/stars.webp",
    topic: "Khám phá",
    progress: 30,
  },
];
