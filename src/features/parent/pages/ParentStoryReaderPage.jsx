import ParentReaderStage from "../components/ParentReaderStage";
import ParentReaderActivities from "../components/ParentReaderActivities";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { useAuth } from "../../auth/useAuth";
import { childrenService } from "../services/childrenService";
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
  const [autoAdvance, setAutoAdvance] = useState(false);
  const isLive = moduleApiModes.parentCatalog === "real";
  const storyQuery = useQuery({
    queryKey: ["parent-story-reader", user?.id, storyId, moduleApiModes.parentCatalog],
    queryFn: ({ signal }) => childrenService.catalogStory({ storyId, signal }),
    enabled: isLive && Boolean(storyId),
    staleTime: 60_000,
  });
  const story = storyQuery.data;
  const pages = story?.pages || [];
  const safePageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const page = pages[safePageIndex];
  const finishPage = useCallback(() => {
    if (autoAdvance) setPageIndex(index => Math.min(index + 1, Math.max(0, pages.length - 1)));
  }, [autoAdvance, pages.length]);

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

      <Link className="parent-text-link parent-reader-back" to={location.state?.returnTo || `/parent/library?story=${encodeURIComponent(storyId || "")}`}>
        <ArrowLeft size={18} aria-hidden="true" /> Về thư viện truyện
      </Link>

      {!isLive ? (
        <section className="family-panel parent-reader-message" role="status">
          <BookOpen size={32} aria-hidden="true" />
          <h2>Chưa bật API thư viện truyện</h2>
          <p>Màn đọc cần chế độ API thật để tải nội dung truyện.</p>
          <Link className="workspace-button" to="/parent/library">Quay lại thư viện</Link>
        </section>
      ) : storyQuery.isPending ? (
        <LoadingState label="Đang tải truyện" />
      ) : storyQuery.isError ? (
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
          <ParentReaderStage key={page.id} story={story} page={page} onFinished={finishPage} />
          <ParentReaderActivities key={`${story.id}:${page.id}`} story={story} page={page} isLastPage={safePageIndex === pages.length - 1} />
          <label className="parent-reader-auto"><input type="checkbox" checked={autoAdvance} onChange={event => setAutoAdvance(event.target.checked)} /> Chuyển trang khi phát xong</label>
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
