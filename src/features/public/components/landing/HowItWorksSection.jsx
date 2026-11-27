import { ArrowRight } from "@phosphor-icons/react";
import Reveal from "./Reveal";

const steps = [
  {
    number: "01",
    title: "Bắt đầu từ nét vẽ",
    text: "Bé vẽ hoặc tải lên một bức tranh mình yêu thích.",
  },
  {
    number: "02",
    title: "Gặp nhân vật của mình",
    text: "Bức tranh trở thành nhân vật để bé đặt tên và khám phá.",
  },
  {
    number: "03",
    title: "Mở trang truyện đầu tiên",
    text: "Bé cùng nhân vật đọc, nghe và trả lời những câu hỏi nhỏ.",
  },
];

export default function HowItWorksSection() {
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
      className="landing-section landing-feature-section"
      id="features"
      aria-labelledby="how-title"
    >
      <div className="landing-container">
        <div className="landing-feature-intro">
          <div className="landing-feature-copy">
            <Reveal as="span" className="landing-kicker" direction="left">
              Cách SketchTale hoạt động
            </Reveal>
            <Reveal as="h2" id="how-title" delay={100} direction="left">
              Một bức vẽ nhỏ.
              <br />
              <em>Một thế giới riêng.</em>
            </Reveal>
            <Reveal as="p" delay={180} direction="left">
              Từ ý tưởng của bé đến những trang truyện có thể đọc cùng nhau.
              Mọi thứ bắt đầu bằng một nét vẽ.
            </Reveal>
            <Reveal
              as="button"
              type="button"
              className="landing-button landing-button-primary landing-feature-cta"
              onClick={showSampleStories}
              delay={240}
              direction="left"
            >
              Tới kệ truyện mẫu <ArrowRight size={19} aria-hidden="true" />
            </Reveal>
          </div>
          <Reveal as="figure" className="landing-feature-visual" delay={160} direction="right">
            <img
              src="/images/seed.webp"
              alt="Mầm cây nhỏ đón nắng và nước trong truyện mẫu Hạt mầm nhỏ."
              width="960"
              height="720"
              loading="lazy"
            />
            <figcaption>
              <span>Trong kệ truyện</span>
              <strong>Hạt mầm nhỏ</strong>
            </figcaption>
          </Reveal>
        </div>
        <div className="landing-step-grid" aria-label="Ba bước khám phá SketchTale">
          {steps.map(({ number, title, text }, index) => (
            <Reveal
              as="article"
              key={number}
              className="landing-step"
              delay={index * 100}
              direction="up"
            >
              <span className="landing-step-number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
