import { ArrowDown, ArrowRight, Sparkle } from "@phosphor-icons/react";
import Reveal from "./Reveal";

export default function LandingHero() {
  return (
    <section
      className="landing-section landing-hero"
      id="top"
      aria-labelledby="landing-hero-title"
    >
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <Reveal as="span" className="landing-kicker" direction="left">
            <Sparkle size={18} weight="fill" aria-hidden="true" /> Ứng dụng kể
            chuyện cho trí tưởng tượng nhỏ
          </Reveal>
          <Reveal
            as="h1"
            id="landing-hero-title"
            delay={100}
            direction="left"
          >
            Mỗi nét vẽ
            <br />
            <em>một câu chuyện.</em>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            Biến tranh vẽ của bé thành nhân vật và đưa nhân vật bước vào những
            câu chuyện tương tác.
          </Reveal>
          <Reveal as="div" className="landing-actions" delay={300} direction="left">
            <a
              className="landing-button landing-button-primary"
              href="#character"
            >
              Bắt đầu ngay <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a className="landing-button landing-button-quiet" href="#stories">
              Khám phá truyện <ArrowRight size={19} aria-hidden="true" />
            </a>
          </Reveal>
          <Reveal
            as="a"
            className="landing-scroll-cue"
            href="#features"
            delay={400}
            direction="left"
          >
            <ArrowDown size={17} aria-hidden="true" /> Xem cách hoạt động
          </Reveal>
        </div>
        <Reveal className="landing-hero-art" delay={160} direction="right">
          <div className="landing-art-backdrop" aria-hidden="true" />
          <img
            className="landing-hero-illustration"
            src="/images/hero.webp"
            alt="Mèo linh vật SketchTale vẫy chào bên cuốn sách mở, bạn Thỏ và mầm cây nhỏ."
            width="960"
            height="720"
            fetchPriority="high"
          />
          <span className="landing-art-note landing-art-note-one">Vẽ</span>
          <span className="landing-art-note landing-art-note-two">
            Tưởng tượng
          </span>
          <span className="landing-art-note landing-art-note-three">
            Khám phá
          </span>
        </Reveal>
      </div>
    </section>
  );
}
