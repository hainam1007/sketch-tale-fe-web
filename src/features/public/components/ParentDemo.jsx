import { useId, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  BookOpen,
  Cat,
  ChartBar,
  CheckCircle,
  Clock,
  Gear,
  House,
  ShieldCheck,
  Star,
  Sun,
  Users,
} from "@phosphor-icons/react";

const children = {
  Mây: {
    age: "8–10 tuổi",
    minutes: 96,
    stories: 4,
    words: 18,
    accuracy: 85,
    icon: Cat,
  },
  Nắng: {
    age: "6–7 tuổi",
    minutes: 72,
    stories: 3,
    words: 12,
    accuracy: 90,
    icon: Sun,
  },
};
const tabs = [
  ["overview", "Tổng quan"],
  ["profile", "Hồ sơ"],
  ["report", "Báo cáo"],
  ["settings", "Cài đặt"],
  ["approvals", "Phê duyệt"],
];
const categories = ["Tình bạn", "Thiên nhiên", "Khám phá"];
const dailyMinutes = {
  Mây: [12, 18, 8, 20, 15, 9, 14],
  Nắng: [8, 12, 9, 14, 10, 7, 12],
};
const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const weekLabels = ["T1", "T2", "T3", "T4"];

function ProgressView({
  child,
  range,
  onRangeChange,
  onTabChange,
  report = false,
}) {
  const data = children[child];
  const factor = range === 30 ? 4 : 1;
  const metrics = [
    [Clock, "Thời gian đọc", `${data.minutes * factor} phút`],
    [BookOpen, "Truyện hoàn thành", data.stories * factor],
    [Star, "Từ vựng khám phá", data.words * factor],
    [CheckCircle, "Trả lời đúng", `${data.accuracy}%`],
  ];
  const values =
    range === 7
      ? dailyMinutes[child]
      : [data.minutes - 8, data.minutes, data.minutes + 4, data.minutes + 4];
  const labels = range === 7 ? dayLabels : weekLabels;
  const maxValue = Math.max(...values);
  return (
    <>
      <div className="parent-preview-heading">
        <div>
          <span className="parent-preview-eyebrow">
            {report ? "BÁO CÁO CỦA BÉ" : "NHỮNG BƯỚC TIẾN NHỎ"}
          </span>
          <h4>
            {report
              ? "Cùng nhìn lại hành trình đọc"
              : `${range === 7 ? "Một tuần" : "30 ngày"} khám phá của ${child}`}
          </h4>
        </div>
        <div
          className="parent-preview-range"
          aria-label="Khoảng thời gian báo cáo"
        >
          {[7, 30].map((days) => (
            <button
              key={days}
              type="button"
              className={range === days ? "is-active" : ""}
              aria-pressed={range === days}
              onClick={() => onRangeChange(days)}
            >
              {days} ngày
            </button>
          ))}
        </div>
      </div>
      <div className="parent-preview-metrics">
        {metrics.map(([Icon, label, value]) => (
          <div key={label}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="parent-preview-lower">
        <div className="parent-preview-chart">
          <div className="parent-preview-panel-title">
            <div>
              <strong>
                {range === 7 ? "Nhịp đọc mỗi ngày" : "Nhịp đọc theo tuần"}
              </strong>
              <span>Thời gian đọc · phút{range === 30 ? " / tuần" : ""}</span>
            </div>
            <ChartBar size={21} aria-hidden="true" />
          </div>
          <div
            className="parent-preview-bars"
            role="img"
            aria-label={`Biểu đồ minh họa thời gian đọc ${range} ngày của ${child}`}
            style={{ gridTemplateColumns: `repeat(${values.length}, 1fr)` }}
          >
            {values.map((value, index) => (
              <div key={labels[index]}>
                <span>{value}</span>
                <i
                  style={{ height: `${Math.round((value / maxValue) * 72)}px` }}
                />
                <small>{labels[index]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="parent-preview-coach">
          <Star size={23} aria-hidden="true" />
          <strong>
            {report ? "Những điều bé đã học" : "Một chút đồng hành mỗi tối"}
          </strong>
          <p>
            {report
              ? "Bé đã gặp những từ mới qua truyện về tình bạn và thiên nhiên. Hãy cùng bé kể lại đoạn yêu thích."
              : `${child} đã đọc ${data.stories} câu chuyện trong tuần. Cùng hỏi bé về nhân vật yêu thích sau khi đọc nhé.`}
          </p>
          <button type="button" onClick={() => onTabChange("approvals")}>
            <ShieldCheck size={17} aria-hidden="true" /> Duyệt nhân vật
          </button>
          <button type="button" onClick={() => onTabChange("settings")}>
            <Gear size={17} aria-hidden="true" /> Điều chỉnh nhịp đọc
          </button>
        </div>
      </div>
    </>
  );
}

export default function ParentDemo() {
  const [tab, setTab] = useState("overview");
  const [child, setChild] = useState("Mây");
  const [range, setRange] = useState(7);
  const [timeLimit, setTimeLimit] = useState({ Mây: 30, Nắng: 20 });
  const [allowedCategories, setAllowedCategories] = useState({
    Mây: categories,
    Nắng: categories,
  });
  const [decisions, setDecisions] = useState({});
  const [message, setMessage] = useState("");
  const id = useId();
  const tabsRef = useRef(null);
  const currentChild = children[child];
  const ChildIcon = currentChild.icon;

  function reset() {
    setTab("overview");
    setChild("Mây");
    setRange(7);
    setTimeLimit({ Mây: 30, Nắng: 20 });
    setAllowedCategories({ Mây: categories, Nắng: categories });
    setDecisions({});
    setMessage("Đã đặt lại bản demo.");
    tabsRef.current?.scrollTo({ left: 0 });
  }

  return (
    <div
      className="parent-preview"
      aria-label="Bản dùng thử giao diện phụ huynh"
    >
      <aside className="parent-preview-sidebar" aria-hidden="true">
        <img
          src="/brand/sketchtale-wordmark.png"
          alt=""
          width="156"
          height="45"
          loading="lazy"
        />
        <span>PHỤ HUYNH</span>
        <div>
          <House size={17} /> Tổng quan
        </div>
        <div className="is-active">
          <Users size={17} /> Hồ sơ bé
        </div>
        <div>
          <BookOpen size={17} /> Thư viện truyện
        </div>
      </aside>
      <div className="parent-preview-main">
        <div className="parent-preview-topline">
          <button
            type="button"
            className="parent-preview-back"
            onClick={() => setTab("profile")}
          >
            ← Tất cả hồ sơ bé
          </button>
          <label className="parent-preview-child-select">
            <span>Đổi hồ sơ</span>
            <select
              value={child}
              onChange={(event) => {
                setChild(event.target.value);
                setMessage("");
              }}
            >
              {Object.keys(children).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="parent-preview-child">
          <span className="parent-preview-avatar">
            <ChildIcon size={31} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <span className="parent-preview-eyebrow">KHÔNG GIAN CỦA BÉ</span>
            <h3>{child}</h3>
            <p>{currentChild.age} · Mỗi ngày một điều mới</p>
          </div>
        </div>
        <div
          ref={tabsRef}
          className="parent-preview-tabs"
          role="tablist"
          aria-label="Các mục trong hồ sơ bé"
        >
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              id={`${id}-${key}-tab`}
              role="tab"
              aria-selected={tab === key}
              aria-controls={`${id}-panel`}
              tabIndex={tab === key ? 0 : -1}
              className={tab === key ? "is-active" : ""}
              onClick={() => {
                setTab(key);
                setMessage("");
              }}
              onKeyDown={(event) => {
                const index = tabs.findIndex(([value]) => value === key);
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % tabs.length
                    : event.key === "ArrowLeft"
                      ? (index - 1 + tabs.length) % tabs.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabs.length - 1
                          : -1;
                if (next < 0) return;
                event.preventDefault();
                setTab(tabs[next][0]);
                event.currentTarget.parentElement
                  .querySelectorAll('[role="tab"]')
                  [next].focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${tab}-tab`}
          className="parent-preview-content"
        >
          {(tab === "overview" || tab === "report") && (
            <ProgressView
              child={child}
              range={range}
              onRangeChange={setRange}
              onTabChange={setTab}
              report={tab === "report"}
            />
          )}
          {tab === "profile" && (
            <div className="parent-preview-detail">
              <span className="parent-preview-eyebrow">HỒ SƠ CỦA BÉ</span>
              <h4>Mỗi bé một không gian riêng</h4>
              <p>
                Chọn hồ sơ để xem thông tin và nhịp đọc phù hợp với từng bé.
              </p>
              <div className="parent-preview-profile-list">
                {Object.entries(children).map(([name, data]) => {
                  const Icon = data.icon;
                  return (
                    <button
                      key={name}
                      type="button"
                      className={child === name ? "is-active" : ""}
                      aria-pressed={child === name}
                      onClick={() => setChild(name)}
                    >
                      <Icon size={26} aria-hidden="true" />
                      <span>
                        <strong>{name}</strong>
                        <small>
                          {data.age} · {timeLimit[name]} phút/ngày
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "settings" && (
            <div className="parent-preview-detail">
              <span className="parent-preview-eyebrow">
                CÀI ĐẶT / {child.toUpperCase()}
              </span>
              <h4>Đặt nhịp đọc vừa đủ cho bé</h4>
              <p>
                Thử thay đổi giới hạn và chủ đề. Lựa chọn chỉ có hiệu lực trong
                bản demo này.
              </p>
              <label className="parent-preview-setting-row">
                <span>Thời gian đọc mỗi ngày</span>
                <select
                  value={timeLimit[child]}
                  onChange={(event) => {
                    setTimeLimit((current) => ({
                      ...current,
                      [child]: Number(event.target.value),
                    }));
                    setMessage("Đã cập nhật cài đặt mẫu.");
                  }}
                >
                  <option value={15}>15 phút</option>
                  <option value={20}>20 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút</option>
                </select>
              </label>
              <div className="parent-preview-categories">
                <strong>Chủ đề được phép</strong>
                <div>
                  {categories.map((category) => (
                    <label key={category}>
                      <input
                        type="checkbox"
                        checked={allowedCategories[child].includes(category)}
                        onChange={() => {
                          setAllowedCategories((current) => ({
                            ...current,
                            [child]: current[child].includes(category)
                              ? current[child].filter(
                                  (item) => item !== category,
                                )
                              : [...current[child], category],
                          }));
                          setMessage("Đã cập nhật cài đặt mẫu.");
                        }}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "approvals" && (
            <div className="parent-preview-detail">
              <span className="parent-preview-eyebrow">
                PHÊ DUYỆT / {child.toUpperCase()}
              </span>
              <h4>Nhân vật chờ bố mẹ xem</h4>
              <p>
                Thử duyệt yêu cầu mẫu. Quyết định chỉ hiển thị trong trang này.
              </p>
              <div className="parent-preview-approval-list">
                {["Bobby", child === "Mây" ? "Mèo Mây" : "Nắng nhỏ"].map(
                  (name) => {
                    const key = `${child}:${name}`;
                    return (
                      <div key={name}>
                        <span className="parent-preview-approval-icon">
                          <Star size={22} aria-hidden="true" />
                        </span>
                        <strong>{name}</strong>
                        {decisions[key] ? (
                          <span className="parent-preview-decision">
                            {decisions[key]}
                          </span>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setDecisions((current) => ({
                                  ...current,
                                  [key]: "Đã duyệt",
                                }));
                                setMessage(`Đã duyệt ${name} trong bản demo.`);
                              }}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDecisions((current) => ({
                                  ...current,
                                  [key]: "Đã từ chối",
                                }));
                                setMessage(
                                  `Đã từ chối ${name} trong bản demo.`,
                                );
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
        <div className="parent-preview-footer">
          <span>
            Bản demo tương tác · Dữ liệu minh họa · Không lưu thay đổi
          </span>
          <button type="button" onClick={reset}>
            <ArrowCounterClockwise size={15} aria-hidden="true" /> Đặt lại
          </button>
        </div>
        {message && (
          <p className="parent-preview-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
