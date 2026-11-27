import { ArrowRight } from "@phosphor-icons/react";
import Reveal from "./Reveal";

export default function CharacterSection() {
  const showSampleStories = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById("stories")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section
      className="landing-section landing-character-section"
      id="character"
      aria-labelledby="character-title"
    >
      <div className="landing-container landing-character-grid">
        <div className="landing-character-copy">
          <Reveal as="span" className="landing-kicker" direction="left">
            Nhân vật của riêng bé
          </Reveal>
          <Reveal as="h2" id="character-title" delay={100} direction="left">
            Nhân vật bé vẽ,
            <br />
            <em>đồng hành cùng bé.</em>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            Từ bức tranh ban đầu, bé có thể đặt tên cho nhân vật và gặp lại
            bạn ấy trong những câu chuyện tương tác.
          </Reveal>
          <Reveal
            as="button"
            type="button"
            className="landing-button landing-button-primary landing-feature-cta"
            onClick={showSampleStories}
            delay={280}
            direction="left"
          >
            Tới kệ truyện mẫu <ArrowRight size={19} aria-hidden="true" />
          </Reveal>
        </div>
        <Reveal as="figure" className="landing-character-showcase" delay={160} direction="right">
          <div className="landing-character-page landing-character-page-sketch">
            <span className="landing-character-page-label">01 / Nét vẽ</span>
            <img
              src="/images/bobby-chinh-dien.webp"
              alt="Tranh minh họa chú chó Bobby đứng nhìn về phía trước."
              width="700"
              height="620"
              loading="lazy"
            />
            <strong>Bobby</strong>
          </div>
          <div className="landing-character-page landing-character-page-motion">
            <span className="landing-character-page-label">02 / Chuyển động</span>
            <img
              src="/images/bobby-di-bo.webp"
              alt="Bobby bước đi trong một tư thế khác."
              width="700"
              height="620"
              loading="lazy"
            />
            <strong>Cùng bé khám phá</strong>
          </div>
          <figcaption>Hình minh họa nhân vật mẫu</figcaption>
        </Reveal>
      </div>
    </section>
  );
}
