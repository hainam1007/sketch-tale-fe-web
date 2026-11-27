import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import ParentDemo from "../ParentDemo";
import Reveal from "./Reveal";

const controls = [
  "Mỗi bé có một hồ sơ riêng",
  "Xem thời gian đọc và tiến độ",
  "Điều chỉnh giới hạn và duyệt nhân vật",
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
              <ShieldCheck size={18} weight="fill" aria-hidden="true" /> Không
              gian cho phụ huynh
            </Reveal>
            <Reveal as="h2" id="parents-title" delay={100} direction="left">
              Bé khám phá mỗi ngày.
              <br />
              <em>Bố mẹ theo dõi từng bước.</em>
            </Reveal>
            <Reveal as="p" delay={200} direction="left">
              Từ một hồ sơ riêng cho bé, bố mẹ có thể xem thói quen đọc, điều
              chỉnh giới hạn và duyệt nội dung cần thiết.
            </Reveal>
          </div>
          <Reveal
            className="landing-parent-benefits"
            delay={180}
            direction="right"
          >
            <ul>
              {controls.map((item, index) => (
                <li key={item}>
                  <span aria-hidden="true">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="landing-parent-demo" delay={300} direction="up">
          <ParentDemo />
        </Reveal>
        <Reveal
          as="a"
          className="landing-text-link"
          href="#pricing"
          delay={420}
          direction="left"
        >
          Xem gói phù hợp cho gia đình{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
