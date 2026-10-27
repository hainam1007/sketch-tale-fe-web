import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Star,
  CheckCircle,
  Heart,
  ArrowLeft,
  ArrowRight,
  ChartBar,
  Gear,
  ShieldCheck,
  PencilSimple,
  Check,
  X,
  UploadSimple,
} from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import { parentProfileService } from "../services/parentProfileService";
import { useParentDemo, demoBooks } from "../services/parentDemoState";
import ChildAvatar from "../components/ChildAvatar";
import { childAvatars } from "../services/childAvatarLibrary";
import { ageLabel } from "../services/profilePresentation";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-experience.css";
const tabs = [
  ["", "Tổng quan"],
  ["profile", "Hồ sơ"],
  ["settings", "Cài đặt"],
  ["approvals", "Phê duyệt"],
  ["library", "Tủ truyện"],
];

function EditableChildName({ child, userId }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.nickName);
  const mutation = useMutation({
    mutationFn: (nickName) =>
      parentProfileService.update({
        childId: child.id,
        nickName,
        dailyTimeLimit: child.dailyTimeLimit ?? null,
        dailyCharacterLimit: child.dailyCharacterLimit ?? null,
      }),
    onSuccess: async (_, nickName) => {
      setName(nickName);
      setEditing(false);
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["parent-live-profiles", userId],
        }),
        client.invalidateQueries({
          queryKey: ["parent-live-profile", userId, child.id],
        }),
      ]);
    },
  });

  if (!editing) {
    return (
      <div className="family-child-name">
        <h1>{name}</h1>
        <button
          className="family-child-name-edit"
          type="button"
          aria-label={`Đổi tên ${name}`}
          title="Sửa tên bé"
          onClick={() => {
            setName(child.nickName);
            mutation.reset();
            setEditing(true);
          }}
        >
          <PencilSimple size={19} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="family-child-name-editor"
      onSubmit={(event) => {
        event.preventDefault();
        const nextName = name.trim();
        if (!nextName || nextName === child.nickName || mutation.isPending)
          return;
        mutation.mutate(nextName);
      }}
    >
      <label className="sr-only" htmlFor={`child-name-${child.id}`}>
        Tên bé
      </label>
      <input
        id={`child-name-${child.id}`}
        autoFocus
        required
        maxLength={60}
        value={name}
        disabled={mutation.isPending}
        onChange={(event) => {
          setName(event.target.value);
          mutation.reset();
        }}
      />
      <button
        className="family-child-name-action family-child-name-save"
        type="submit"
        aria-label="Lưu tên bé"
        title="Lưu tên"
        disabled={
          !name.trim() || name.trim() === child.nickName || mutation.isPending
        }
      >
        <Check size={19} aria-hidden="true" />
      </button>
      <button
        className="family-child-name-action"
        type="button"
        aria-label="Hủy sửa tên"
        title="Hủy"
        disabled={mutation.isPending}
        onClick={() => {
          setName(child.nickName);
          mutation.reset();
          setEditing(false);
        }}
      >
        <X size={19} aria-hidden="true" />
      </button>
      {mutation.isError && (
        <span className="family-child-name-error" role="alert">
          {mutation.error.message}
        </span>
      )}
    </form>
  );
}

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
  if (section === "progress" || section === "exports")
    return (
      <Navigate
        to={`/parent/children/${encodeURIComponent(childId)}${section === "exports" ? "/library" : ""}`}
        replace
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
  const [publishingStoryId, setPublishingStoryId] = useState("");
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
  function publishDemoStory(event, book) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      exports: [
        {
          id: Date.now(),
          storyId: book.id,
          title: book.title,
          format: form.get("format"),
        },
        ...(demo.exports || []).filter((item) => item.storyId !== book.id),
      ],
    });
    setPublishingStoryId("");
    setNotice(
      `Đã tạo bản xuất ${form.get("format")} minh họa cho “${book.title}”.`,
    );
  }
  return (
    <div className="parent-page family-workspace">
      <Link
        className="workspace-button workspace-button-quiet family-back"
        to="/parent/children"
      >
        <ArrowLeft size={17} aria-hidden="true" /> Tất cả hồ sơ bé
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
          <EditableChildName child={child} userId={userId} />
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
            <div className="family-settings">
              <fieldset>
                <legend>Biểu tượng của bé</legend>
                <div className="family-avatar-options">
                  {childAvatars.map((avatar, index) => (
                    <label key={index}>
                      <input
                        type="radio"
                        name="avatar"
                        value={index}
                        checked={
                          index ===
                          (demo.avatar ??
                            Math.max(
                              0,
                              family.findIndex((item) => item.id === child.id),
                            ))
                        }
                        onChange={() => update({ avatar: index })}
                      />
                      <ChildAvatar index={index} size={28} />
                      <span className="sr-only">{avatar.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="family-learning family-profile-details">
                <label>
                  Ngày sinh
                  <input
                    type="date"
                    name="birthday"
                    value={demo.birthday || ""}
                    max={new Date().toLocaleDateString("en-CA")}
                    onChange={(event) =>
                      update({ birthday: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {notice && (
            <p className="family-notice" role="status">
              <CheckCircle size={19} />
              {notice}
            </p>
          )}
          {isOverview && (
            <>
              <div className="family-section-heading">
                <div>
                  <p className="workspace-eyebrow">NHỮNG BƯỚC TIẾN NHỎ</p>
                  <h2>Một tuần khám phá của {child.nickName}</h2>
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
              <section className="family-panel">
                <div className="family-section-heading">
                  <h2>Bố mẹ có thể làm ngay</h2>
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
            </>
          )}
          {section === "settings" && (
            <form
              className="family-panel family-settings"
              onSubmit={saveSettings}
            >
              <h2>Một nhịp đọc phù hợp với bé</h2>
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
                      <div className="family-book-actions">
                        <button
                          className="workspace-button workspace-button-quiet"
                          type="button"
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
                        <button
                          className="workspace-button workspace-button-quiet family-publish-button"
                          type="button"
                          onClick={() =>
                            setPublishingStoryId((current) =>
                              current === book.id ? "" : book.id,
                            )
                          }
                        >
                          <UploadSimple size={17} aria-hidden="true" />
                          {demo.exports?.some(
                            (item) => item.storyId === book.id,
                          )
                            ? "Xuất bản lại"
                            : "Xuất bản"}
                        </button>
                      </div>
                      {demo.exports?.some(
                        (item) => item.storyId === book.id,
                      ) && (
                        <small className="family-publish-status">
                          Bản xuất{" "}
                          {
                            demo.exports.find(
                              (item) => item.storyId === book.id,
                            )?.format
                          }{" "}
                          · bản demo
                        </small>
                      )}
                      {publishingStoryId === book.id && (
                        <form
                          className="family-publish-form"
                          onSubmit={(event) => publishDemoStory(event, book)}
                        >
                          <label>
                            Định dạng
                            <select name="format" defaultValue="PDF">
                              <option>PDF</option>
                              <option>Video</option>
                            </select>
                          </label>
                          <button className="workspace-button" type="submit">
                            Tạo bản xuất demo
                          </button>
                        </form>
                      )}
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
        </>
      )}
    </div>
  );
}
