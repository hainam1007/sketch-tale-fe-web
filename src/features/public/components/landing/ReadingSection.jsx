import {
  BookOpenText,
  Check,
  HighlighterCircle,
  Play,
  Question,
  SpeakerHigh,
} from "@phosphor-icons/react";
import Reveal from "./Reveal";

const benefits = [
  [SpeakerHigh, "Giọng đọc"],
  [HighlighterCircle, "Tô sáng chữ"],
  [BookOpenText, "Từ vựng mới"],
  [Question, "Câu hỏi sau truyện"],
];

export default function ReadingSection() {
  return (
    <section
      className="landing-section landing-reading-section"
      id="reading"
      aria-labelledby="reading-title"
    >
      <div className="landing-container landing-reading-grid">
        <Reveal className="landing-reader-preview" direction="left">
          <div className="landing-reader-top">
            <span>Truyện mẫu</span>
            <span>Trang 2 / 3</span>
          </div>
          <div className="landing-reader-body">
            <img
              src="/images/rabbit.webp"
              alt="Thỏ và Sóc cùng chia sẻ chiếc ô vàng trong khu vườn."
              width="800"
              height="600"
            />
            <div className="landing-reader-copy">
              <span className="landing-reader-category">Một tình bạn nhỏ</span>
              <h3>Dưới cùng một chiếc ô</h3>
              <p>
                <mark>Dưới gốc cây, Sóc đang nép mình tránh mưa.</mark> “Bạn đi
                cùng mình nhé!” Thỏ gọi.
              </p>
              <div className="landing-reader-controls">
                <button type="button" aria-label="Phát lời kể">
                  <Play size={18} weight="fill" aria-hidden="true" />
                </button>
                <span>
                  <i />
                </span>
                <small>Cùng lắng nghe</small>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="landing-reading-copy">
          <Reveal as="span" className="landing-kicker" direction="right">
            Mỗi trang mở ra một khoảnh khắc bên nhau
          </Reveal>
          <Reveal as="h2" id="reading-title" delay={100} direction="right">
            Đọc, lắng nghe,
            <br />
            <em>học và chơi.</em>
          </Reveal>
          <Reveal as="p" delay={200} direction="right">
            Câu chuyện giúp bé chậm lại, lắng nghe kỹ hơn và kể cho bố mẹ điều
            mình nhận ra. Từ mới và nhân vật riêng của bé khiến mỗi lần đọc trở
            nên gần gũi hơn.
          </Reveal>
          <Reveal as="ul" delay={320} direction="right">
            {benefits.map(([Icon, label]) => (
              <li key={label}>
                <Icon size={24} weight="duotone" aria-hidden="true" />
                <span>{label}</span>
                <Check size={18} aria-hidden="true" />
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
