import { useState } from "react";
import {
  BookOpen,
  Heart,
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  PaperPlaneTilt,
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
  const [failed, setFailed] = useState(false);
  return story.imageUrl && !failed ? (
    <img
      src={story.imageUrl}
      alt={`Bìa truyện ${story.title}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="family-book-cover-fallback">
      <BookOpen size={42} weight="duotone" />
      <strong>{story.title}</strong>
      <span>SketchTale · {topicLabel(story.category)}</span>
    </div>
  );
}
export default function ParentLibraryPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [demo, updateDemo] = useParentDemo(user.id, "catalog");
  const [sort, setSort] = useState("default");
  const [savedOnly, setSavedOnly] = useState(false);
  const catalog = useQuery({
    queryKey: ["parent-stories", user.id],
    queryFn: ({ signal }) => childrenService.storyCatalog({ signal }),
  });
  const search = params.get("q") || "";
  const category = params.get("category") || "";
  const stories = catalog.data?.items || [];
  const selected = stories.find((story) => story.id === params.get("story"));
  const saved = demo.saved || [];
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
    <div className="parent-page parent-catalog family-catalog">
      <header className="family-library-heading">
        <div>
          <p className="workspace-eyebrow">KỆ TRUYỆN CỦA GIA ĐÌNH</p>
          <h1>
            Mở trang sách.
            <br />
            Khám phá điều bé yêu.
          </h1>
          <p>
            Một cuộc phiêu lưu, một người bạn mới, hay một câu chuyện nhỏ trước
            giờ ngủ.
          </p>
        </div>
        <div className="family-library-art">
          <img src="/images/rabbit.webp" alt="Chú thỏ trong thế giới truyện" />
          <span>Mỗi ngày, một câu chuyện</span>
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
          <section className="family-library-controls">
            <label className="library-search">
              <MagnifyingGlass size={22} />
              <span className="sr-only">Tìm truyện</span>
              <input
                value={search}
                placeholder="Bé muốn khám phá điều gì?"
                onChange={(event) => update("q", event.target.value)}
              />
            </label>
            <button
              className="family-save-filter"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly(!savedOnly)}
            >
              <Heart weight={savedOnly ? "fill" : "regular"} size={20} /> Đã lưu
              ({saved.length})
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
              <p>{filtered.length} truyện · Mở bìa để xem thêm</p>
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
            <div className="catalog-grid">
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
