import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import Reveal from "./Reveal";

export default function FinalSection() {
  return (
    <section
      className="landing-section landing-final-section"
      id="final"
      aria-labelledby="final-title"
    >
      <div className="landing-container landing-final-grid">
        <div className="landing-final-copy">
          <Reveal as="span" className="landing-kicker" direction="left">
            <Sparkle size={18} weight="fill" aria-hidden="true" /> Trang đầu
            tiên đang chờ bé
          </Reveal>
          <Reveal as="h2" id="final-title" delay={100} direction="left">
            Sẵn sàng biến
            <br />
            <em>nét vẽ nhỏ</em>
            <br />
            <span className="landing-final-nowrap">thành cuộc phiêu lưu lớn?</span>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            Bắt đầu bằng một ý tưởng nhỏ và xem câu chuyện đưa bé đi đâu.
          </Reveal>
          <Reveal as="div" className="landing-actions" delay={300} direction="left">
            <a href="#character" className="landing-button landing-button-dark">
              Bắt đầu sáng tạo <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a href="#stories" className="landing-button landing-button-quiet">
              Khám phá truyện <ArrowRight size={19} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
        <Reveal className="landing-final-art" delay={160} direction="right">
          <div className="landing-final-art-card">
            <img
              src="/images/hero.webp"
              alt="Mèo linh vật SketchTale vui mừng bên cuốn sách mở."
              width="960"
              height="720"
              loading="eager"
            />
          </div>
          <span className="landing-final-sticker">
            Mỗi nét vẽ
            <br />
            một câu chuyện.
          </span>
        </Reveal>
      </div>
    </section>
  );
}
