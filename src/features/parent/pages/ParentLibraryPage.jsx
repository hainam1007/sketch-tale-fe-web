import { useState } from "react";
import {
  BookOpen,
  Heart,
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  PaperPlaneTilt,
  SquaresFour,
  ListBullets,
  X,
  Sparkle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { childrenService } from "../services/childrenService";
import { parentProfileService } from "../services/parentProfileService";
import { useParentDemo } from "../services/parentDemoState";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-library.css";
import "../parent-experience.css";
import "../parent-library-redesign.css";
const topicNames = {
  Nature: "Thiên nhiên",
  Courage: "Lòng can đảm",
  Kindness: "Lòng tốt",
  Friendship: "Tình bạn",
  Family: "Gia đình",
  Adventure: "Phiêu lưu",
};
function topicLabel(value) {
  return topicNames[value] || value || "Khám phá";
}
function Cover({ story }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return story.imageUrl && failedUrl !== story.imageUrl ? (
    <img
      src={story.imageUrl}
      alt={`Bìa truyện ${story.title}`}
      onError={() => setFailedUrl(story.imageUrl)}
    />
  ) : (
    <div
      className={`library-designed-cover library-cover-${story.category || "default"}`}
    >
      <img
        src={
          story.category === "Nature" || story.category === "Thiên nhiên"
            ? "/images/seed.webp"
            : story.category === "Courage" || story.category === "Adventure"
              ? "/images/stars.webp"
              : "/images/rabbit.webp"
        }
        alt=""
        aria-hidden="true"
      />
      <div className="library-jacket-title">
        <span>SKETCHTALE</span>
        <strong>{story.title}</strong>
        <span>{topicLabel(story.category)}</span>
      </div>
    </div>
  );
}
export default function ParentLibraryPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [demo, updateDemo] = useParentDemo(user.id, "catalog");
  const [sort, setSort] = useState("default");
  const [savedOnly, setSavedOnly] = useState(false);
  const [view, setView] = useState("grid");
  const catalog = useQuery({
    queryKey: ["parent-stories", user.id],
    queryFn: ({ signal }) => childrenService.storyCatalog({ signal }),
  });
  const search = params.get("q") || "";
  const category = params.get("category") || "";
  const stories = catalog.data?.items || [];
  const selected = stories.find((story) => story.id === params.get("story"));
  const saved = demo.saved || [];
  const savedCount = stories.filter((story) => saved.includes(story.id)).length;
  const featured = stories[0];
  const hasFilters = Boolean(search || category || savedOnly);
  const normalize = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();
  const filtered = stories
    .filter(
      (story) =>
        (!category || story.category === category) &&
        (!savedOnly || saved.includes(story.id)) &&
        normalize(
          `${story.title} ${story.description} ${topicLabel(story.category)}`,
        ).includes(normalize(search)),
    )
    .sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title, "vi") : 0,
    );
  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: name !== "story" });
  }
  function favorite(id) {
    updateDemo({
      saved: saved.includes(id)
        ? saved.filter((value) => value !== id)
        : [...saved, id],
    });
  }
  return (
    <div className="parent-page parent-catalog family-catalog library-redesign">
      <header className="family-library-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / THƯ VIỆN TRUYỆN</p>
          <h1>Thư viện truyện</h1>
              <p>Mỗi trang sách, một thế giới mới.</p>
        </div>
        <div className="library-heading-note">
          <BookOpen size={24} weight="duotone" aria-hidden="true" />
          <span>
            Mỗi ngày,
            <br />
            <strong>một câu chuyện</strong>
          </span>
        </div>
      </header>
      {selected ? (
        <StoryDetail
          key={selected.id}
          story={selected}
          userId={user.id}
          onBack={() => update("story", "")}
        />
      ) : (
        <>
          {catalog.isSuccess && featured && (
            <section
              className={`library-discovery ${stories.length < 2 ? "library-discovery-single" : ""}`}
              aria-label="Khám phá truyện"
            >
              <article className="library-spotlight">
                <div className="library-spotlight-copy">
                  <p className="library-overline">
                    <Sparkle size={16} weight="fill" aria-hidden="true" /> CÙNG
                    BÉ KHÁM PHÁ
                  </p>
                  <span className="library-topic-label">
                    {topicLabel(featured.category)}
                  </span>
                  <h2>{featured.title}</h2>
                  <p>
                    {featured.description ||
                      "Mở câu chuyện và cùng bé khám phá những điều thú vị qua từng trang sách."}
                  </p>
                  <button
                    className="workspace-button"
                    onClick={() => update("story", featured.id)}
                  >
                    Khám phá câu chuyện{" "}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
                <button
                  className="library-spotlight-cover"
                  onClick={() => update("story", featured.id)}
                  aria-label={`Khám phá ${featured.title}`}
                >
                  <Cover key={featured.id} story={featured} />
                </button>
              </article>
              {stories.length > 1 && (
                <aside
                  className="library-next-shelf"
                  aria-labelledby="library-next-title"
                >
                  <p className="library-overline">TRÊN KỆ SÁCH</p>
                  <h2 id="library-next-title">Thêm một câu chuyện</h2>
                  {stories.slice(1, 3).map((story) => (
                    <button
                      className="library-mini-book"
                      key={story.id}
                      aria-label={`Xem truyện ${story.title}`}
                      onClick={() => update("story", story.id)}
                    >
                      <div className="library-mini-cover">
                        <Cover story={story} />
                      </div>
                      <span className="library-mini-copy">
                        <small>{topicLabel(story.category)}</small>
                        <strong>{story.title}</strong>
                        <span>
                          Xem truyện <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </span>
                    </button>
                  ))}
                </aside>
              )}
            </section>
          )}
          <section className="library-browse" aria-label="Tìm và chọn truyện">
            <section className="family-library-controls">
              <label className="library-search">
                <MagnifyingGlass size={22} />
                <span className="sr-only">Tìm truyện</span>
                <input
                  value={search}
                  placeholder="Bé muốn khám phá điều gì?"
                  onChange={(event) => update("q", event.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="library-clear-search"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => update("q", "")}
                  >
                    <X size={17} />
                  </button>
                )}
              </label>
              <button
                className="family-save-filter"
                aria-pressed={savedOnly}
                onClick={() => setSavedOnly(!savedOnly)}
              >
                <Heart weight={savedOnly ? "fill" : "regular"} size={20} /> Đã
                lưu ({savedCount})
              </button>
              <label className="family-sort">
                <span className="sr-only">Sắp xếp truyện</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="default">Thứ tự thư viện</option>
                  <option value="title">Tên truyện A–Z</option>
                </select>
              </label>
            </section>
            <div className="catalog-filters" aria-label="Chủ đề truyện">
              {[
                "",
                ...new Set(
                  stories.map((story) => story.category).filter(Boolean),
                ),
              ].map((value) => (
                <button
                  key={value}
                  aria-pressed={category === value}
                  onClick={() => update("category", value)}
                >
                  {value ? topicLabel(value) : "Tất cả truyện"}
                </button>
              ))}
            </div>
            <div className="family-section-heading">
              <div>
                <h2>
                  {savedOnly
                    ? "Những truyện muốn đọc cùng bé"
                    : category
                      ? topicLabel(category)
                      : "Chọn một câu chuyện hôm nay"}
                </h2>
                <p role="status">
                  {catalog.isPending
                    ? "Đang mở kệ truyện…"
                    : `${filtered.length} truyện${search ? ` cho “${search}”` : " · Cùng bé mở một trang sách mới"}`}
                </p>
              </div>
              <div className="library-results-actions">
                {hasFilters && (
                  <button
                    className="library-reset"
                    onClick={() => {
                      const next = new URLSearchParams(params);
                      next.delete("q");
                      next.delete("category");
                      setParams(next, { replace: true });
                      setSavedOnly(false);
                    }}
                  >
                    Xóa bộ lọc <X size={14} aria-hidden="true" />
                  </button>
                )}
                <div
                  className="library-view-toggle"
                  role="group"
                  aria-label="Cách hiển thị truyện"
                >
                  <button
                    aria-label="Xem dạng lưới"
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                  >
                    <SquaresFour size={19} aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Xem dạng danh sách"
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    <ListBullets size={19} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            {catalog.isPending ? (
              <LoadingState label="Đang mở kệ truyện" />
            ) : catalog.isError ? (
              <ErrorState
                message={catalog.error.message}
                onRetry={() => catalog.refetch()}
              />
            ) : filtered.length ? (
              <div className={`catalog-grid library-view-${view}`}>
                {filtered.map((story) => (
                  <article className="catalog-book" key={story.id}>
                    <div className="family-cover-wrap">
                      <button
                        className="catalog-cover"
                        onClick={() => update("story", story.id)}
                        aria-label={`Xem trước ${story.title}`}
                      >
                        <Cover story={story} />
                        {(story.totalPageNumbers > 0 ||
                          story.pages?.length > 0) && (
                          <span>
                            {story.totalPageNumbers || story.pages.length} trang
                          </span>
                        )}
                      </button>
                      <button
                        className="family-book-heart"
                        aria-label={`${saved.includes(story.id) ? "Bỏ lưu" : "Lưu"} ${story.title}`}
                        aria-pressed={saved.includes(story.id)}
                        onClick={() => favorite(story.id)}
                      >
                        <Heart
                          size={21}
                          weight={saved.includes(story.id) ? "fill" : "regular"}
                        />
                      </button>
                    </div>
                    <div className="catalog-book-copy">
                      <p className="catalog-category">
                        {topicLabel(story.category)}
                      </p>
                      <h3>
                        <button onClick={() => update("story", story.id)}>
                          {story.title}
                        </button>
                      </h3>
                      <p>{story.description}</p>
                      <button
                        className="parent-text-link"
                        onClick={() => update("story", story.id)}
                      >
                        Khám phá câu chuyện <ArrowRight size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="family-panel family-empty">
                <BookOpen size={40} />
                <h2>
                  {savedOnly
                    ? "Lưu một câu chuyện cho tối nay"
                    : "Chưa tìm thấy câu chuyện phù hợp"}
                </h2>
                <p>
                  Thử chủ đề khác hoặc chọn biểu tượng trái tim trên bìa truyện.
                </p>
                <button
                  className="workspace-button"
                  onClick={() => {
                    setParams({});
                    setSavedOnly(false);
                  }}
                >
                  Xem tất cả truyện
                </button>
              </div>
            )}
          </section>
          <p className="family-demo-note">
            Danh sách đã lưu được giữ trong phiên demo trên thiết bị này.
          </p>
        </>
      )}
    </div>
  );
}
function StoryDetail({ story, userId, onBack }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [sent, setSent] = useState(false);
  const [demo, update] = useParentDemo(userId, "recommendations");
  const detail = useQuery({
    queryKey: ["parent-catalog-story", userId, story.id],
    queryFn: ({ signal }) =>
      childrenService.catalogStory({ storyId: story.id, signal }),
    enabled: moduleApiModes.parentCatalog === "real",
  });
  const family = useQuery({
    queryKey: ["parent-live-profiles", userId],
    queryFn: parentProfileService.list,
  });
  const current = detail.data || story;
  const page = current.pages?.[pageIndex];
  return (
    <section className="catalog-detail">
      <button className="parent-text-link" onClick={onBack}>
        <ArrowLeft size={18} /> Về thư viện truyện
      </button>
      {detail.isError ? (
        <ErrorState
          message={detail.error.message}
          onRetry={() => detail.refetch()}
        />
      ) : detail.isLoading ? (
        <LoadingState />
      ) : (
        <div className="catalog-detail-grid">
          <article className="catalog-reader">
            <div className="catalog-reader-heading">
              <p className="catalog-category">{topicLabel(current.category)}</p>
              <h2>{current.title}</h2>
              <p>{current.description}</p>
            </div>
            {page ? (
              <>
                <div className="catalog-page">
                  {page.imageUrl && (
                    <img
                      src={page.imageUrl}
                      alt={page.title || "Minh họa truyện"}
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  )}
                  <div>
                    <h3>{page.title}</h3>
                    <p>{page.text}</p>
                  </div>
                </div>
                <nav className="catalog-pagination" aria-label="Trang truyện">
                  <button
                    className="workspace-button workspace-button-quiet"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex(pageIndex - 1)}
                  >
                    Trang trước
                  </button>
                  <span>
                    Trang {pageIndex + 1} / {current.pages.length}
                  </span>
                  <button
                    className="workspace-button workspace-button-quiet"
                    disabled={pageIndex === current.pages.length - 1}
                    onClick={() => setPageIndex(pageIndex + 1)}
                  >
                    Trang tiếp theo
                  </button>
                </nav>
              </>
            ) : (
              <div className="family-story-preview">
                <Cover story={current} />
                <p>Giới thiệu câu chuyện để bố mẹ chọn đọc cùng bé.</p>
              </div>
            )}
          </article>
          <aside className="catalog-recommend">
            <PaperPlaneTilt size={30} />
            <h2>Để dành cho bé</h2>
            <p>Gửi câu chuyện vào danh sách gợi ý của một bạn nhỏ.</p>
            {family.isPending ? (
              <LoadingState />
            ) : family.isError ? (
              <ErrorState
                message={family.error.message}
                onRetry={() => family.refetch()}
              />
            ) : family.data.length ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  update({
                    items: [
                      ...(demo.items || []).filter(
                        (item) =>
                          !(
                            item.childId === recipient &&
                            item.storyId === current.id
                          ),
                      ),
                      {
                        childId: recipient,
                        storyId: current.id,
                        title: current.title,
                      },
                    ],
                  });
                  setSent(true);
                }}
              >
                <label>
                  Chọn bé
                  <select
                    required
                    value={recipient}
                    onChange={(event) => {
                      setRecipient(event.target.value);
                      setSent(false);
                    }}
                  >
                    <option value="">Chọn một hồ sơ</option>
                    {family.data.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.nickName}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="workspace-button"
                  disabled={!recipient || sent}
                >
                  {sent ? "Đã gửi gợi ý" : "Gợi ý cho bé"}
                </button>
                {sent && <p role="status">Đã lưu gợi ý trong phiên demo.</p>}
              </form>
            ) : (
              <Link className="workspace-button" to="/parent/children/new">
                Thêm hồ sơ bé
              </Link>
            )}
            <p className="family-demo-note">
              Gợi ý cho bé là thao tác demo, không gửi thông báo thật.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
