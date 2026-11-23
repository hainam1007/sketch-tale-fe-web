import ParentReaderStage from "../components/ParentReaderStage";
import ParentReaderActivities from "../components/ParentReaderActivities";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CaretDown, PaperPlaneTilt } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { useAuth } from "../../auth/useAuth";
import { childrenService } from "../services/childrenService";
import { parentProfileService } from "../services/parentProfileService";
import { previewProfiles, showFamilyProfilePreview } from "../services/familyProfilePreview";
import { useParentDemo } from "../services/parentDemoState";
import "../parent-library.css";
import "../parent-experience.css";
import "../parent-library-redesign.css";

export default function ParentStoryReaderPage() {
  const { storyId } = useParams();
  const { user } = useAuth();
  return <Reader key={`${user?.id}:${storyId}`} />;
}

function Reader() {
  const { storyId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [pageIndex, setPageIndex] = useState(0);
  const [completedPageId, setCompletedPageId] = useState(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const isLive = moduleApiModes.parentCatalog === "real";
  const isFamilyLive = moduleApiModes.parentProfile === "real";
  const [recommendations, updateRecommendations] = useParentDemo(user?.id || "guest", "recommendations");
  const savedChildIds = (recommendations.items || [])
    .filter((item) => item.storyId === storyId)
    .map((item) => item.childId);
  const [selectedChildIds, setSelectedChildIds] = useState(savedChildIds);
  const [recommendationSaved, setRecommendationSaved] = useState(false);
  const storyQuery = useQuery({
    queryKey: ["parent-story-reader", user?.id, storyId, moduleApiModes.parentCatalog],
    queryFn: ({ signal }) => childrenService.catalogStory({ storyId, signal }),
    enabled: isLive && Boolean(storyId),
    staleTime: 60_000,
  });
  const familyQuery = useQuery({
    queryKey: ["parent-live-profiles-v2", user?.id],
    queryFn: ({ signal }) => parentProfileService.list({ user, signal }),
    enabled: isFamilyLive && Boolean(user?.id),
    staleTime: 60_000,
  });
  const children = isFamilyLive
    ? familyQuery.data || []
    : showFamilyProfilePreview
      ? previewProfiles
      : [];
  const story = storyQuery.data || location.state?.story;
  const pages = story?.pages || [];
  const safePageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const page = pages[safePageIndex];
  const finishPagePlayback = useCallback(() => setCompletedPageId(page?.id), [page?.id]);
  function toggleChild(childId) {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId],
    );
    setRecommendationSaved(false);
  }
  function saveRecommendations(event) {
    event.preventDefault();
    const childIds = children.map((child) => child.id ?? child.Id);
    const selected = new Set(selectedChildIds);
    const nextItems = (recommendations.items || []).filter(
      (item) => item.storyId !== storyId || !childIds.includes(item.childId),
    );
    nextItems.push(
      ...children
        .filter((child) => selected.has(child.id ?? child.Id))
        .map((child) => ({
          childId: child.id ?? child.Id,
          storyId,
          title: story?.title || "Câu chuyện",
        })),
    );
    updateRecommendations({ items: nextItems });
    setRecommendationSaved(true);
  }

  return (
    <div className="parent-page parent-catalog family-catalog library-redesign parent-reader-page">
      <header className="family-library-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / ĐỌC TRUYỆN</p>
          <h1>{story?.title || "Đọc truyện"}</h1>
          <p>{story?.description || "Cùng bé khám phá từng trang sách."}</p>
        </div>
        <div className="library-heading-note" aria-hidden="true">
          <BookOpen size={24} weight="duotone" />
          <span>Mỗi ngày,<br /><strong>một câu chuyện</strong></span>
        </div>
      </header>

      <div className="parent-reader-toolbar">
        <Link className="parent-text-link parent-reader-back library-back-button" to={location.state?.returnTo || "/parent/library"}>
          <ArrowLeft size={18} aria-hidden="true" /> Về thư viện truyện
        </Link>
        <div className="parent-reader-recommend">
          <button
            className="workspace-button workspace-button-quiet parent-reader-recommend-trigger"
            type="button"
            aria-expanded={recommendationOpen}
            onClick={() => setRecommendationOpen((open) => !open)}
          >
            <PaperPlaneTilt size={18} aria-hidden="true" /> Đề xuất truyện <CaretDown size={16} aria-hidden="true" />
          </button>
          {recommendationOpen && (
            <form className="parent-reader-recommend-menu" onSubmit={saveRecommendations}>
              <strong>Chọn bé nhận đề xuất</strong>
              {isFamilyLive && familyQuery.isPending ? (
                <LoadingState label="Đang tải hồ sơ bé" />
              ) : isFamilyLive && familyQuery.isError ? (
                <ErrorState message={familyQuery.error.message} onRetry={() => familyQuery.refetch()} />
              ) : children.length ? (
                <>
                  <div className="parent-reader-recommend-options">
                    {children.map((child) => {
                      const id = child.id ?? child.Id;
                      const name = child.nickName || child.NickName || child.displayName || child.name || "Bé";
                      return (
                        <label key={id}>
                          <input type="checkbox" checked={selectedChildIds.includes(id)} onChange={() => toggleChild(id)} />
                          <span>{name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button className="workspace-button" type="submit" disabled={!selectedChildIds.length}>
                    {recommendationSaved ? "Đã đề xuất" : "Đề xuất"}
                  </button>
                  {recommendationSaved && <p className="parent-reader-recommend-status" role="status">Đã đề xuất truyện cho bé.</p>}
                </>
              ) : (
                <p>Chưa có hồ sơ bé để chọn.</p>
              )}
            </form>
          )}
        </div>
      </div>

      {!isLive && !location.state?.story ? (
        <section className="family-panel parent-reader-message" role="status">
          <BookOpen size={32} aria-hidden="true" />
          <h2>Chưa bật API thư viện truyện</h2>
          <p>Màn đọc cần chế độ API thật để tải nội dung truyện.</p>
          <Link className="workspace-button" to="/parent/library">Quay lại thư viện</Link>
        </section>
      ) : isLive && storyQuery.isPending ? (
        <LoadingState label="Đang tải truyện" />
      ) : isLive && storyQuery.isError ? (
        <ErrorState message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />
      ) : !pages.length ? (
        <section className="family-panel parent-reader-message">
          <BookOpen size={32} aria-hidden="true" />
          <h2>Truyện chưa có trang được phát hành</h2>
          <p>Hiện chưa có trang Active để hiển thị.</p>
          <Link className="workspace-button" to="/parent/library">Về thư viện truyện</Link>
        </section>
      ) : (
        <main className="parent-reader-shell">
          <div className="parent-reader-meta">
            <span>{story.category || "Câu chuyện"}</span>
            <span>Trang {safePageIndex + 1} / {pages.length}</span>
          </div>
          <ParentReaderStage key={page.id} story={story} page={page} onFinished={finishPagePlayback} />
          <ParentReaderActivities key={`${story.id}:${page.id}`} story={story} page={page} isLastPage={safePageIndex === pages.length - 1} isPageComplete={completedPageId === page.id} />
          <nav className="catalog-pagination parent-reader-pagination" aria-label="Điều hướng trang truyện">
            <button
              className="workspace-button workspace-button-quiet"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
            >
              <ArrowLeft size={18} aria-hidden="true" /> Trang trước
            </button>
            <span aria-live="polite">{safePageIndex + 1} / {pages.length}</span>
            <button
              className="workspace-button"
              disabled={safePageIndex >= pages.length - 1}
              onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
            >
              Trang tiếp theo <ArrowRight size={18} aria-hidden="true" />
            </button>
          </nav>
        </main>
      )}
    </div>
  );
}
