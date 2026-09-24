import { ArrowRight, Check, ShieldCheck } from "@phosphor-icons/react";
import ParentDemo from "../ParentDemo";
import Reveal from "./Reveal";

const controls = [
  "Quản lý hồ sơ của bé",
  "Duyệt nhân vật",
  "Đặt giới hạn thời gian",
  "Kiểm soát nhóm truyện",
  "Theo dõi tiến độ đọc",
  "Xem từ vựng và kết quả câu hỏi",
];

export default function ParentSection() {
  return (
    <section
      className="landing-section landing-parent-section"
      id="parents"
      aria-labelledby="parents-title"
    >
      <div className="landing-container">
        <div className="landing-section-heading landing-section-heading-row">
          <div className="landing-section-heading-row-copy">
            <Reveal as="span" className="landing-kicker" direction="left">
              <ShieldCheck size={18} weight="fill" aria-hidden="true" /> Một góc
              bình yên cho bố mẹ
            </Reveal>
            <Reveal as="h2" id="parents-title" delay={100} direction="left">
              Dành cho bé khám phá.
              <br />
              <em>Bố mẹ đồng hành.</em>
            </Reveal>
            <Reveal as="p" delay={200} direction="left">
              Cho bé không gian tự do khám phá, trong khi những lựa chọn quan
              trọng vẫn nằm trong tay bố mẹ.
            </Reveal>
          </div>
          <Reveal className="landing-parent-list" delay={180} direction="right">
            <ul>
              {controls.map((item) => (
                <li key={item}>
                  <Check size={17} weight="bold" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="landing-parent-demo" delay={300} direction="up">
          <ParentDemo />
        </Reveal>
        <Reveal as="a" className="landing-text-link" href="#pricing" delay={420} direction="left">
          Xem gói phù hợp cho gia đình{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
