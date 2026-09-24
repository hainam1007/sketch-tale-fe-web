import {
  ArrowRight,
  MagicWand,
  PencilSimple,
  Sparkle,
} from "@phosphor-icons/react";
import Reveal from "./Reveal";

export default function CharacterSection() {
  return (
    <section
      className="landing-section landing-character-section"
      id="character"
      aria-labelledby="character-title"
    >
      <div className="landing-container landing-character-grid">
        <div className="landing-character-copy">
          <Reveal as="span" className="landing-kicker" direction="left">
            <MagicWand size={18} weight="fill" aria-hidden="true" /> Để bé làm
            nhân vật chính
          </Reveal>
          <Reveal as="h2" id="character-title" delay={100} direction="left">
            Nét vẽ của bé
            <br />
            <em>thành người hùng.</em>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            SketchTale đặt trí tưởng tượng của bé ở trung tâm. Vẽ, đặt tên, rồi
            nhìn nhân vật bước vào một câu chuyện.
          </Reveal>
          <Reveal
            as="a"
            className="landing-button landing-button-primary"
            href="#stories"
            delay={300}
            direction="left"
          >
            Xem truyện gợi ý <ArrowRight size={19} aria-hidden="true" />
          </Reveal>
        </div>
        <div className="landing-character-flow">
          <Reveal
            className="landing-character-stage landing-drawing-stage"
            direction="left"
          >
            <div className="landing-doodle">
              <PencilSimple size={35} weight="duotone" aria-hidden="true" />
              <span>Tranh của bé</span>
              <strong>ngôi sao nhỏ</strong>
            </div>
          </Reveal>
          <Reveal
            className="landing-flow-arrow"
            delay={120}
            direction="up"
          >
            <ArrowRight size={30} aria-hidden="true" />
            <span>Phép màu AI</span>
            <Sparkle size={17} weight="fill" aria-hidden="true" />
          </Reveal>
          <Reveal
            className="landing-character-stage landing-result-stage"
            delay={240}
            direction="right"
          >
            <img
              src="/images/stars.webp"
              alt="Mèo linh vật SketchTale nhìn ngôi sao qua kính viễn vọng."
              width="480"
              height="360"
            />
            <span>Nhân vật SketchTale</span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
