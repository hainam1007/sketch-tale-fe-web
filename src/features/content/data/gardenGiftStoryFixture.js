import { gardenGiftAnimation } from "./gardenGiftAnimation.js";

// Authored local story. The supplied recording is intentionally reused in full
// on every page; captions describe the story, not a transcript of that recording.
const createdAt = "2026-10-28T03:00:00.000Z";
export const gardenGiftAudio = {
  id: "asset-garden-gift-giang",
  name: "Giang · Giọng kể dùng chung",
  kind: "audio",
  mimeType: "audio/mpeg",
  size: 935194,
  duration: 57.391,
  url: "/audio/garden-gift-giang.mp3",
  createdAt,
};

const scenes = [
  {
    title: "Tiếng gọi ngoài hiên", background: "hallway", pose: "walk", x: 67,
    lines: [
      "Sáng ấy, Bobby đang nằm trong hành lang thì nghe tiếng xào xạc ngoài hiên. Chú vểnh tai, chiếc chuông nhỏ trên cổ khẽ rung.",
      "Một chiếc lá vàng lướt qua cửa, xoay tròn rồi nằm yên trong vệt nắng. Bobby bước tới, chạm mũi vào mép lá.",
      "Chú định mang món quà ấy về chiếc đệm của mình. Nhưng một cơn gió nhẹ lại nhấc chiếc lá lên.",
      "Bobby đi theo, chậm rãi để không giẫm lên những chậu cây. Phía cuối hành lang, khu vườn đang sáng bừng.",
      "Hôm nay, chú quyết định sẽ tìm xem chiếc lá đến từ đâu. Cuộc khám phá bắt đầu bằng một bước chân thật khẽ.",
    ],
  },
  {
    title: "Dấu nắng trên sàn", background: "living-room", pose: "front", x: 70,
    lines: [
      "Chiếc lá bay vào phòng khách rồi mắc lại bên cửa sổ. Bobby ngẩng đầu, nhìn bóng lá rung rinh trên sàn.",
      "Chú bật người định với lấy, nhưng bỗng dừng lại. Ngay cạnh chân chú là chậu cây nhỏ đang nghiêng về phía nắng.",
      "Bobby lùi một bước, nhường chỗ cho những chiếc lá xanh. Chú không muốn làm đổ chậu cây chỉ vì vội vàng.",
      "Gió lại thổi. Chiếc lá vàng thoát khỏi cửa sổ, lượn một vòng như đang vẫy chào rồi bay ra vườn.",
      "Bobby vui vẻ đi theo lối cửa mở. Chú hiểu rằng đi chậm một chút cũng có thể giúp mình nhìn thấy nhiều điều hơn.",
    ],
  },
  {
    title: "Một điều bé xíu", background: "garden", pose: "stand-left", x: 72,
    lines: [
      "Ngoài vườn, chiếc lá vàng đáp xuống gần bồn hoa. Bobby chạy đến, nhưng vừa cúi xuống đã nhìn thấy một mầm cây bé xíu.",
      "Mầm cây mọc sát lối đi. Hai chiếc lá non còn khép, run run mỗi khi gió lùa qua những cánh hoa.",
      "Bobby nhấc chân lên rồi đặt sang bên. Nếu cứ mải đuổi chiếc lá, có lẽ chú đã giẫm trúng người bạn nhỏ ấy.",
      "Chú ngồi yên quan sát. Một giọt nước trên lá non lấp lánh như hạt ngọc, còn chiếc lá vàng nằm ngay cạnh gốc.",
      "Bobby chợt quên mất ý định giữ chiếc lá cho riêng mình. Chú muốn biết làm thế nào để mầm cây được bình yên.",
    ],
  },
  {
    title: "Món quà ở lại", background: "garden", pose: "sit", x: 68,
    lines: [
      "Một luồng gió mạnh thổi tới. Chiếc lá vàng trượt ra lối đi, còn mầm cây nghiêng xuống sát mặt đất.",
      "Bobby đứng chắn phía gió, giữ chân thật xa gốc cây. Chú đợi đến khi những cánh hoa thôi rung mới cúi đầu.",
      "Bằng một cái chạm mũi nhẹ, chú đẩy chiếc lá về bên bồn hoa. Lá nằm cạnh mầm cây, không che lên hai chiếc lá non.",
      "Bobby ngắm món quà của mình rồi khẽ vẫy đuôi. Chú quyết định để chiếc lá ở lại nơi nó đã bắt đầu chuyến đi.",
      "Có những món quà không cần mang về nhà mới là của mình. Được chăm chút cho một điều bé nhỏ cũng khiến lòng vui thật lâu.",
    ],
  },
  {
    title: "Mang niềm vui về nhà", background: "living-room", pose: "sit", x: 70,
    lines: [
      "Bobby trở về phòng khách khi nắng đã trải rộng trên sàn. Chiếc đệm vẫn ở đó, nhưng trên mũi chú chẳng có chiếc lá nào.",
      "Chú nằm xuống, nhớ lại mầm cây và giọt nước sáng long lanh. Chiếc chuông nhỏ khẽ reo khi chú nghiêng đầu nhìn ra vườn.",
      "Chuyến đi hôm nay không đem về một món đồ mới. Nó đem về một bí mật: biết quan tâm cũng là một cách nhận quà.",
      "Ngày mai, Bobby sẽ lại ra vườn bằng lối đi cũ. Chú sẽ bước chậm, nhìn kỹ và chừa một khoảng thật rộng cho mầm cây.",
      "Ngoài cửa, gió khẽ lay những tán lá. Bobby nhắm mắt, đuôi vẫn vẫy nhè nhẹ. Khu vườn đã có thêm một người bạn dịu dàng.",
    ],
  },
];

export const gardenGiftStoryFixture = {
  id: "story-bobby-mon-qua-khu-vuon",
  title: "Bobby và món quà của khu vườn",
  description: "Một chiếc lá dẫn Bobby tới mầm cây bên lối đi. Qua năm trang truyện, chú học cách chậm lại, quan sát và chăm chút cho những điều bé nhỏ.",
  category: "Thiên nhiên", status: "draft", coverAssetId: "asset-bobby-garden",
  pagesCount: 5, updatedAt: createdAt, revision: 1,
  publishedVersionId: null, draftDirty: false,
  pages: scenes.map((scene, index) => ({
    id: `page-garden-gift-${index + 1}`, order: index + 1, title: scene.title,
    text: scene.lines.join("\n\n"), narration: scene.lines.join(" "),
    backgroundAssetId: `asset-bobby-${scene.background}`,
    subtitles: scene.lines.map((text, cueIndex) => ({
      id: `subtitle-garden-gift-${index + 1}-${cueIndex + 1}`, text,
      startMs: Math.round(cueIndex * 57391 / scene.lines.length),
      durationMs: Math.round((cueIndex + 1) * 57391 / scene.lines.length) - Math.round(cueIndex * 57391 / scene.lines.length),
    })),
    audioTracks: [{ id: `audio-garden-gift-${index + 1}`, assetId: gardenGiftAudio.id, name: gardenGiftAudio.name, type: "voiceover", startMs: 0, trimStartMs: 0, durationMs: 57391, volume: 0.8 }],
    animationClips: gardenGiftAnimation(index, { id: `slot-garden-gift-${index + 1}`, x: scene.x, y: 60, scale: 1.05 }),
    sequence: [], imageObjects: [],
  })),
  roles: [{
    id: "role-garden-gift-bobby", name: "Bobby", custom: true, sensitive: false,
    description: "Chú chó tò mò, học cách quan sát và đối xử dịu dàng với khu vườn.",
    defaultAssetId: "asset-bobby-front",
    slots: scenes.map((scene, index) => ({ id: `slot-garden-gift-${index + 1}`, pageId: `page-garden-gift-${index + 1}`, x: scene.x, y: 60, scale: 1.05, rotation: 0, flip: false, layer: 2, anchor: "center", assetId: `asset-bobby-${scene.pose}` })),
  }],
  vocabulary: [
    { id: "vocab-gift-1", pageId: "page-garden-gift-1", word: "xào xạc", meaning: "Tiếng lá khẽ chạm vào nhau khi có gió.", audioUrl: "" },
    { id: "vocab-gift-2", pageId: "page-garden-gift-3", word: "mầm cây", meaning: "Cây còn rất nhỏ, vừa bắt đầu mọc lên.", audioUrl: "" },
    { id: "vocab-gift-3", pageId: "page-garden-gift-5", word: "dịu dàng", meaning: "Nhẹ nhàng và biết quan tâm, không làm tổn thương người khác.", audioUrl: "" },
  ],
  quizzes: [{ id: "quiz-gift-1", pageId: "page-garden-gift-5", question: "Vì sao Bobby bước chậm lại trong vườn?", options: ["Để không giẫm lên mầm cây", "Vì chú không thích khu vườn", "Để giấu chiếc lá vàng"], correctIndex: 0, feedback: "Bobby biết quan sát và chừa chỗ cho mầm cây được lớn lên.", audioUrl: "" }],
  versions: [],
};
