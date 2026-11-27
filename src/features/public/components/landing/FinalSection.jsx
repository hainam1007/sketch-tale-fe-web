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
            <span className="landing-final-highlight">
              <svg
                className="landing-final-rays landing-final-rays-left"
                viewBox="0 0 48 80"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M37 17 23 4M23 40H4m33 23L23 76" />
              </svg>
              <em>nét vẽ nhỏ</em>
              <svg
                className="landing-final-rays landing-final-rays-right"
                viewBox="0 0 48 80"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m11 17 14-13m-14 36h19M11 63l14 13" />
              </svg>
            </span>
            <br />
            <span className="landing-final-nowrap">thành cuộc phiêu lưu lớn?</span>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            Bắt đầu bằng một ý tưởng nhỏ và xem câu chuyện đưa bé đi đâu.
          </Reveal>
          <Reveal as="div" className="landing-actions" delay={300} direction="left">
            <a href="#character" className="landing-button landing-button-dark">
              Xem cách tạo nhân vật <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a href="#stories" className="landing-button landing-button-quiet">
              Tới kệ truyện mẫu <ArrowRight size={19} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
