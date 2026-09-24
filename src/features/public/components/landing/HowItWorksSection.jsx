import {
  ArrowRight,
  MagicWand,
  PencilLine,
  Sparkle,
} from "@phosphor-icons/react";
import Reveal from "./Reveal";

const steps = [
  {
    number: "01",
    title: "Vẽ",
    text: "Bé vẽ hoặc tải lên một bức tranh.",
    icon: PencilLine,
    color: "blue",
  },
  {
    number: "02",
    title: "Tạo nhân vật",
    text: "AI biến bức tranh thành nhân vật hoạt hình.",
    icon: MagicWand,
    color: "yellow",
  },
  {
    number: "03",
    title: "Khám phá",
    text: "Nhân vật cùng bé bước vào những câu chuyện tương tác.",
    icon: Sparkle,
    color: "coral",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      className="landing-section landing-feature-section"
      id="features"
      aria-labelledby="how-title"
    >
      <div className="landing-container">
        <div className="landing-section-heading">
          <Reveal as="span" className="landing-kicker" direction="left">
            SketchTale hoạt động như thế nào
          </Reveal>
          <Reveal as="h2" id="how-title" delay={100} direction="left">
            Từ một nét vẽ
            <br />
            <em>đến một cuộc phiêu lưu.</em>
          </Reveal>
          <Reveal as="p" delay={200} direction="left">
            Một thói quen sáng tạo nhỏ mở ra cả thế giới mới.
          </Reveal>
        </div>
        <div className="landing-step-grid">
          {steps.map(({ number, title, text, icon: Icon, color }, index) => (
            <Reveal
              as="article"
              key={title}
              className={`landing-step landing-step-${color}`}
              delay={index * 120}
              direction="up"
            >
              <div className="landing-step-icon">
                <Icon size={32} weight="duotone" aria-hidden="true" />
              </div>
              <span className="landing-step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="landing-step-arrow"
                  size={28}
                  aria-hidden="true"
                />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
