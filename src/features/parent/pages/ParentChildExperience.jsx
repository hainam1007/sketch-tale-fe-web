import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Star,
  CheckCircle,
  DownloadSimple,
  Heart,
  ArrowRight,
  ChartBar,
  Gear,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useAuth } from "../../auth/AuthProvider";
import { parentProfileService } from "../services/parentProfileService";
import { useParentDemo, demoBooks } from "../services/parentDemoState";
import ChildAvatar from "../components/ChildAvatar";
import { ageLabel } from "../services/profilePresentation";
import LiveChildProfilePage from "./LiveChildProfilePage";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-experience.css";
const tabs = [
  ["", "Tổng quan"],
  ["profile", "Hồ sơ"],
  ["progress", "Báo cáo"],
  ["settings", "Cài đặt"],
  ["approvals", "Phê duyệt"],
  ["library", "Tủ truyện"],
  ["exports", "Bản xuất"],
];
export default function ParentChildExperience({ childId, section = "" }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["parent-live-profile", user.id, childId],
    queryFn: ({ signal }) => parentProfileService.get({ childId, signal }),
  });
  const family = useQuery({
    queryKey: ["parent-live-profiles", user.id],
    queryFn: parentProfileService.list,
  });
  if (query.isPending)
    return <LoadingState label="Đang mở không gian của bé" />;
  if (query.isError)
    return (
      <ErrorState
        title="Chưa mở được hồ sơ"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  return (
    <ChildExperience
      key={childId}
      child={query.data}
      section={section}
      userId={user.id}
      family={family.data || []}
    />
  );
}
function ChildExperience({ child, section, userId, family }) {
  const [demo, update] = useParentDemo(userId, child.id);
  const [recommendations] = useParentDemo(userId, "recommendations");
  const navigate = useNavigate();
  const [range, setRange] = useState("7");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const base = `/parent/children/${encodeURIComponent(child.id)}`;
  const isOverview = !section || section === "dashboard";
  const decisions = demo.decisions || {};
  const favorites = demo.favorites || [];
  const metrics = range === "7" ? [96, 4, 18, 85] : [382, 16, 64, 88];
  const chartValues =
    range === "7" ? [12, 18, 8, 20, 15, 9, 14] : [82, 100, 93, 107];
  const chartLabels =
    range === "7"
      ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
      : ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
  function saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      goal: Number(form.get("goal")),
      reminder: form.get("reminder"),
      reminderEnabled: form.get("reminderEnabled") === "on",
      sharing: form.get("sharing") === "on",
      approval: form.get("approval") === "on",
      topics: form.getAll("topics"),
    });
    setNotice("Đã lưu lựa chọn demo cho riêng bé.");
  }
  function exportReport() {
    const body = `BÁO CÁO MINH HỌA — ${child.nickName}\n${range} ngày\nThời gian đọc: ${metrics[0]} phút\nTruyện hoàn thành: ${metrics[1]}\nTừ vựng: ${metrics[2]}\nKết quả câu hỏi: ${metrics[3]}%\nKhông phải dữ liệu học tập thật.`;
    const url = URL.createObjectURL(
      new Blob([body], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-minh-hoa.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="parent-page family-workspace">
      <Link className="family-back" to="/parent/children">
        ← Tất cả hồ sơ bé
      </Link>
      <header className="family-child-heading">
        <ChildAvatar
          id={child.id}
          index={
            demo.avatar ??
            Math.max(
              0,
              family.findIndex((item) => item.id === child.id),
            )
          }
          size={42}
        />
        <div>
          <p className="workspace-eyebrow">KHÔNG GIAN CỦA BÉ</p>
          <h1>{child.nickName}</h1>
          <p>{ageLabel(child.targetAgeGroup)} · Mỗi ngày một điều mới</p>
        </div>
        <label className="family-switch">
          Đổi hồ sơ
          <select
            value={child.id}
            onChange={(event) =>
              navigate(
                `/parent/children/${encodeURIComponent(event.target.value)}`,
              )
            }
          >
            {family.length ? (
              family.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.nickName}
                </option>
              ))
            ) : (
              <option value={child.id}>{child.nickName}</option>
            )}
          </select>
        </label>
      </header>
      <nav className="family-tabs" aria-label="Không gian của bé">
        {tabs.map(([path, label]) => (
          <NavLink key={path} end to={`${base}${path ? `/${path}` : ""}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      {section === "profile" ? (
        <>
          <section className="family-panel">
            <h2>Cá tính và sở thích của bé</h2>
            <p className="family-demo-note">
              Các lựa chọn bổ sung dưới đây được lưu trong bản demo.
            </p>
            <form
              className="family-settings"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                update({
                  avatar: Number(form.get("avatar")),
                  birthday: form.get("birthday"),
                  readingLevel: form.get("readingLevel"),
                });
                setNotice("Đã lưu thông tin bổ sung trong bản demo.");
              }}
            >
              <fieldset>
                <legend>Biểu tượng của bé</legend>
                <div className="family-avatar-options">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <label key={index}>
                      <input
                        type="radio"
                        name="avatar"
                        value={index}
                        defaultChecked={
                          index ===
                          (demo.avatar ??
                            Math.max(
                              0,
                              family.findIndex((item) => item.id === child.id),
                            ))
                        }
                      />
                      <ChildAvatar index={index} size={28} />
                      <span className="sr-only">Biểu tượng {index + 1}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="family-learning">
                <label>
                  Ngày sinh
                  <input
                    type="date"
                    name="birthday"
                    defaultValue={demo.birthday || ""}
                    max={new Date().toLocaleDateString("en-CA")}
                  />
                </label>
                <label>
                  Nhịp đọc hiện tại
                  <select
                    name="readingLevel"
                    defaultValue={demo.readingLevel || "together"}
                  >
                    <option value="together">Đọc cùng bố mẹ</option>
                    <option value="beginner">Bắt đầu tự đọc</option>
                    <option value="independent">Tự đọc và khám phá</option>
                  </select>
                </label>
              </div>
              {notice && <p role="status">{notice}</p>}
              <button className="workspace-button">Lưu thông tin demo</button>
            </form>
          </section>
          <LiveChildProfilePage childId={child.id} />
        </>
      ) : (
        <>
          <p className="family-demo-note">
            Dữ liệu minh họa · Các thao tác trong khu vực này được lưu riêng cho
            bản demo.
          </p>
          {notice && (
            <p className="family-notice" role="status">
              <CheckCircle size={19} />
              {notice}
            </p>
          )}
          {(isOverview || section === "progress") && (
            <>
              <div className="family-section-heading">
                <div>
                  <p className="workspace-eyebrow">
                    {isOverview ? "NHỮNG BƯỚC TIẾN NHỎ" : "BÁO CÁO CỦA BÉ"}
                  </p>
                  <h2>
                    {isOverview
                      ? `Một tuần khám phá của ${child.nickName}`
                      : "Cùng nhìn lại hành trình đọc"}
                  </h2>
                </div>
                <div className="family-range">
                  <button
                    aria-pressed={range === "7"}
                    onClick={() => setRange("7")}
                  >
                    7 ngày
                  </button>
                  <button
                    aria-pressed={range === "30"}
                    onClick={() => setRange("30")}
                  >
                    30 ngày
                  </button>
                </div>
              </div>
              <div className="family-metrics">
                {[
                  [Clock, "Thời gian đọc", `${metrics[0]} phút`],
                  [BookOpen, "Truyện hoàn thành", metrics[1]],
                  [Star, "Từ vựng khám phá", metrics[2]],
                  [CheckCircle, "Trả lời đúng", `${metrics[3]}%`],
                ].map(([Icon, label, value]) => (
                  <article key={label}>
                    <Icon size={22} />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <div className="family-report-grid">
                <section className="family-panel">
                  <div className="family-section-heading">
                    <div>
                      <h2>Nhịp đọc mỗi ngày</h2>
                      <p>Thời gian đọc · phút</p>
                    </div>
                    <ChartBar size={25} />
                  </div>
                  <div
                    className="family-chart"
                    role="img"
                    aria-label={`Biểu đồ minh họa: ${chartValues.map((value, index) => `${chartLabels[index]} ${value} phút`).join(", ")}`}
                  >
                    {chartValues.map((value, i) => (
                      <div key={i}>
                        <span>{value}</span>
                        <div
                          className="family-bar"
                          style={{
                            height: `${value * (range === "7" ? 5 : 1)}px`,
                          }}
                        />
                        <small>{chartLabels[i]}</small>
                      </div>
                    ))}
                  </div>
                </section>
                <aside className="family-panel family-coach">
                  <Star size={29} weight="duotone" />
                  <h2>Một chút đồng hành mỗi tối</h2>
                  <p>
                    Bé đã đọc 4 câu chuyện trong tuần. Hãy thử hỏi: “Nếu là nhân
                    vật chính, con sẽ làm gì?” sau câu chuyện tiếp theo.
                  </p>
                  <div className="family-goal">
                    <span>Mục tiêu: {demo.goal || 15} phút/ngày</span>
                    <Link to={`${base}/settings`}>
                      Điều chỉnh <ArrowRight size={16} />
                    </Link>
                  </div>
                  <Link className="workspace-button" to="/parent/library">
                    Chọn truyện đọc cùng bé
                  </Link>
                </aside>
              </div>
              {section === "progress" ? (
                <section className="family-panel">
                  <div className="family-section-heading">
                    <div>
                      <h2>Những điều bé đã học</h2>
                      <p>Gợi ý để bố mẹ trò chuyện cùng bé</p>
                    </div>
                    <button
                      className="workspace-button workspace-button-quiet"
                      onClick={exportReport}
                    >
                      <DownloadSimple size={18} /> Tải báo cáo mẫu
                    </button>
                  </div>
                  <div className="family-learning">
                    <article>
                      <h3>Từ vựng mới</h3>
                      <p>Hạt giống · Khu vườn · Chia sẻ · Can đảm</p>
                      <small>
                        Thử dùng một từ mới trong câu chuyện của gia đình.
                      </small>
                    </article>
                    <article>
                      <h3>Điểm mạnh</h3>
                      <p>Nhận biết cảm xúc và nhớ các nhân vật.</p>
                      <small>
                        Khuyến khích bé kể lại đoạn yêu thích bằng lời của mình.
                      </small>
                    </article>
                    <article>
                      <h3>Cùng luyện tập</h3>
                      <p>Sắp xếp các sự kiện theo thứ tự.</p>
                      <small>“Điều gì xảy ra đầu tiên? Sau đó thì sao?”</small>
                    </article>
                  </div>
                </section>
              ) : (
                <section className="family-panel">
                  <div className="family-section-heading">
                    <h2>Bố mẹ có thể làm ngay</h2>
                    <Link to={`${base}/progress`}>
                      Xem báo cáo <ArrowRight size={17} />
                    </Link>
                  </div>
                  <div className="family-action-grid">
                    <Link to={`${base}/approvals`}>
                      <ShieldCheck size={25} />
                      <strong>Duyệt nhân vật</strong>
                      <span>
                        {2 - Object.keys(decisions).length} yêu cầu chờ bố mẹ
                      </span>
                    </Link>
                    <Link to={`${base}/library`}>
                      <BookOpen size={25} />
                      <strong>Tiếp tục câu chuyện</strong>
                      <span>Khu vườn của những người bạn</span>
                    </Link>
                    <Link to={`${base}/settings`}>
                      <Gear size={25} />
                      <strong>Nhịp đọc phù hợp</strong>
                      <span>Mục tiêu, lịch nhắc và quyền riêng tư</span>
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
          {section === "settings" && (
            <form
              className="family-panel family-settings"
              onSubmit={saveSettings}
            >
              <h2>Một nhịp đọc phù hợp với bé</h2>
              <p>
                Mục tiêu và lựa chọn dưới đây dùng cho bản demo. Giới hạn tài
                khoản thật được chỉnh tại tab Hồ sơ.
              </p>
              <div className="family-learning">
                <label>
                  Mục tiêu đọc mỗi ngày
                  <select name="goal" defaultValue={demo.goal || 15}>
                    {[10, 15, 20, 30].map((value) => (
                      <option key={value} value={value}>
                        {value} phút
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Giờ đọc cùng gia đình
                  <input
                    type="time"
                    name="reminder"
                    defaultValue={demo.reminder || "20:00"}
                  />
                </label>
              </div>
              <label className="family-toggle">
                <span>
                  <strong>Nhắc giờ đọc</strong>
                  <small>Dành một khoảng thời gian nhỏ cùng nhau mỗi tối</small>
                </span>
                <input
                  type="checkbox"
                  name="reminderEnabled"
                  defaultChecked={demo.reminderEnabled ?? true}
                />
              </label>
              <fieldset>
                <legend>Chủ đề bé yêu thích</legend>
                <div className="family-topics">
                  {[
                    "Thiên nhiên",
                    "Khám phá",
                    "Lòng tốt",
                    "Gia đình",
                    "Động vật",
                  ].map((topic) => (
                    <label key={topic}>
                      <input
                        type="checkbox"
                        name="topics"
                        value={topic}
                        defaultChecked={(
                          demo.topics || ["Thiên nhiên", "Động vật"]
                        ).includes(topic)}
                      />
                      {topic}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="family-toggle">
                <span>
                  <strong>Xin bố mẹ duyệt nhân vật mới</strong>
                  <small>Xem trước hình ảnh trước khi dùng trong truyện</small>
                </span>
                <input
                  type="checkbox"
                  name="approval"
                  defaultChecked={demo.approval ?? true}
                />
              </label>
              <label className="family-toggle">
                <span>
                  <strong>Cho phép chia sẻ tác phẩm</strong>
                  <small>Bố mẹ kiểm tra tác phẩm trước khi chia sẻ</small>
                </span>
                <input
                  type="checkbox"
                  name="sharing"
                  defaultChecked={demo.sharing ?? false}
                />
              </label>
              <div className="parent-form-actions">
                <Link
                  className="workspace-button workspace-button-quiet"
                  to={`${base}/profile`}
                >
                  Giới hạn tài khoản thật
                </Link>
                <button className="workspace-button">Lưu lựa chọn demo</button>
              </div>
            </form>
          )}
          {section === "approvals" && (
            <section className="family-panel">
              <h2>Những sáng tạo chờ bố mẹ</h2>
              <p>
                Xem nhân vật và quyết định trước khi bé sử dụng trong truyện.
              </p>
              <div className="family-range">
                {[
                  ["all", "Tất cả"],
                  ["pending", "Chờ duyệt"],
                  ["approved", "Đã đồng ý"],
                  ["rejected", "Đã từ chối"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="family-approval-grid">
                {demoBooks
                  .slice(0, 2)
                  .filter(
                    (book) =>
                      filter === "all" ||
                      (decisions[book.id] || "pending") === filter,
                  )
                  .map((book) => (
                    <article key={book.id}>
                      <img
                        src={book.image}
                        alt={`Nhân vật minh họa cho ${book.title}`}
                      />
                      <div>
                        <h3>
                          {book.id === "garden" ? "Bạn Mầm nhỏ" : "Thỏ Bông"}
                        </h3>
                        <p>Nhân vật mới · Yêu cầu dùng trong truyện</p>
                        <p className="family-decision">
                          {
                            {
                              approved: "Đã đồng ý",
                              rejected: "Đã từ chối",
                              pending: "Chờ bố mẹ duyệt",
                            }[decisions[book.id] || "pending"]
                          }
                        </p>
                        <div className="parent-form-actions">
                          <button
                            className="workspace-button workspace-button-quiet"
                            onClick={() => {
                              update({
                                decisions: {
                                  ...decisions,
                                  [book.id]: "rejected",
                                },
                              });
                              setNotice("Đã từ chối yêu cầu trong bản demo.");
                            }}
                          >
                            Từ chối
                          </button>
                          <button
                            className="workspace-button"
                            onClick={() => {
                              update({
                                decisions: {
                                  ...decisions,
                                  [book.id]: "approved",
                                },
                              });
                              setNotice(
                                "Đã đồng ý sử dụng nhân vật trong bản demo.",
                              );
                            }}
                          >
                            Đồng ý
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {!demoBooks
                .slice(0, 2)
                .some(
                  (book) =>
                    filter === "all" ||
                    (decisions[book.id] || "pending") === filter,
                ) && (
                <p className="family-empty">Không có yêu cầu trong nhóm này.</p>
              )}
            </section>
          )}
          {section === "library" && (
            <section className="family-panel">
              <div className="family-section-heading">
                <div>
                  <h2>Tủ truyện của {child.nickName}</h2>
                  <p>Những câu chuyện đang đọc và muốn đọc lại</p>
                </div>
                <Link className="workspace-button" to="/parent/library">
                  Thêm truyện
                </Link>
              </div>
              {(recommendations.items || [])
                .filter((item) => item.childId === child.id)
                .map((item) => (
                  <div className="family-export-row" key={item.storyId}>
                    <BookOpen size={22} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>Bố mẹ vừa gợi ý · Demo</small>
                    </span>
                    <Link
                      to={`/parent/library?story=${encodeURIComponent(item.storyId)}`}
                    >
                      Xem truyện
                    </Link>
                  </div>
                ))}
              <div className="family-range">
                <button
                  aria-pressed={filter !== "favorite"}
                  onClick={() => setFilter("all")}
                >
                  Tất cả
                </button>
                <button
                  aria-pressed={filter === "favorite"}
                  onClick={() => setFilter("favorite")}
                >
                  Yêu thích
                </button>
              </div>
              <div className="family-book-grid">
                {demoBooks
                  .filter(
                    (book) =>
                      filter !== "favorite" || favorites.includes(book.id),
                  )
                  .map((book) => (
                    <article key={book.id}>
                      <img src={book.image} alt={book.title} />
                      <small>{book.topic}</small>
                      <h3>{book.title}</h3>
                      <progress
                        max="100"
                        value={book.progress}
                        aria-label={`Đã đọc ${book.progress}%`}
                      />
                      <p>
                        {book.progress === 100
                          ? "Đã đọc xong"
                          : `Đã đọc ${book.progress}%`}
                      </p>
                      <button
                        className="workspace-button workspace-button-quiet"
                        aria-pressed={favorites.includes(book.id)}
                        onClick={() =>
                          update({
                            favorites: favorites.includes(book.id)
                              ? favorites.filter((id) => id !== book.id)
                              : [...favorites, book.id],
                          })
                        }
                      >
                        <Heart
                          weight={
                            favorites.includes(book.id) ? "fill" : "regular"
                          }
                        />
                        {favorites.includes(book.id)
                          ? "Đã yêu thích"
                          : "Yêu thích"}
                      </button>
                    </article>
                  ))}
              </div>
              {filter === "favorite" && !favorites.length && (
                <p className="family-empty">
                  Chạm trái tim ở một truyện để lưu vào danh sách yêu thích.
                </p>
              )}
            </section>
          )}
          {section === "exports" && (
            <section className="family-panel">
              <h2>Lưu lại câu chuyện của bé</h2>
              <p>Chọn tác phẩm và định dạng để thử luồng xuất truyện.</p>
              <form
                className="family-settings"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  update({
                    exports: [
                      {
                        id: Date.now(),
                        title: form.get("story"),
                        format: form.get("format"),
                      },
                      ...(demo.exports || []),
                    ],
                  });
                  setNotice(
                    "Đã tạo bản xuất minh họa. Chưa tạo file PDF/video thật.",
                  );
                }}
              >
                <label>
                  Câu chuyện
                  <select name="story">
                    {demoBooks.map((book) => (
                      <option key={book.id}>{book.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Định dạng
                  <select name="format">
                    <option>PDF</option>
                    <option>Video</option>
                  </select>
                </label>
                <button className="workspace-button">Tạo bản xuất demo</button>
              </form>
              <h3>Lịch sử bản xuất</h3>
              {(demo.exports || []).length ? (
                demo.exports.map((item) => (
                  <div className="family-export-row" key={item.id}>
                    <BookOpen size={22} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.format} · Hoàn tất mô phỏng</small>
                    </span>
                    <button
                      className="workspace-button workspace-button-quiet"
                      onClick={exportReport}
                    >
                      Tải tệp mẫu TXT
                    </button>
                  </div>
                ))
              ) : (
                <p>Chọn một câu chuyện để tạo bản xuất đầu tiên.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
