import { useEffect, useRef, useState } from "react";
import { BookOpen } from "@phosphor-icons/react";
import StoryCard from "../StoryCard";
import Reveal from "./Reveal";

export default function StoryLibrarySection({ stories, loading, error }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const previewStories = stories?.slice(0, 3) ?? [];
  return (
    <section
      className="landing-section landing-stories-section"
      id="stories"
      aria-labelledby="stories-title"
    >
      <div className="landing-container">
        <div className="landing-section-heading landing-section-heading-row">
          <div className="landing-section-heading-row-copy">
            <Reveal as="span" className="landing-kicker" direction="left">
              Một kệ truyện đầy điều bất ngờ
            </Reveal>
            <Reveal as="h2" id="stories-title" delay={100} direction="left">
              Những câu chuyện
              <br />
              <em>chờ bé khám phá.</em>
            </Reveal>
            <Reveal as="p" delay={200} direction="left">
              Đọc một câu chuyện trọn vẹn, hoặc đưa nhân vật của bé vào chuyến
              phiêu lưu riêng.
            </Reveal>
          </div>
          <Reveal delay={140} direction="right">
            <BookOpen
              className="landing-heading-icon"
              size={86}
              weight="duotone"
              aria-hidden="true"
            />
          </Reveal>
        </div>
        {loading && (
          <div className="landing-story-loading" role="status">
            Đang mở kệ truyện...
          </div>
        )}
        {error && (
          <div className="landing-story-loading" role="alert">
            Kệ truyện đang cần thêm chút thời gian. Hãy tải lại trang để thử lại.
          </div>
        )}
        {!loading && !error && (
          <div className="landing-story-grid">
            {previewStories.map((story, index) => (
              <Reveal key={story.id} delay={index * 120} direction="up">
                <StoryCard
                  story={story}
                  featured={index === 0}
                  loading="eager"
                  onRead={setSelectedStory}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
      {selectedStory && (
        <SampleStoryDialog
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </section>
  );
}

function SampleStoryDialog({ story, onClose }) {
  const [pageIndex, setPageIndex] = useState(0);
  const dialogRef = useRef(null);
  const page = story.pages?.[pageIndex];
  const pageCount = story.pages?.length ?? 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    return undefined;
  }, []);

  const closeDialog = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  };

  return (
    <dialog
      className="sample-story-dialog"
      aria-labelledby="sample-story-title"
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="sample-story-dialog-header">
        <span>{story.category} · Truyện mẫu</span>
        <button type="button" className="sample-story-close" onClick={closeDialog}>
          Đóng
        </button>
      </div>
      <div className="sample-story-dialog-content">
        <img src={page?.image || story.cover} alt={page?.alt || story.coverAlt || ""} />
        <div className="sample-story-dialog-copy">
          <span className="sample-story-page-count">
            Trang {pageIndex + 1} / {pageCount}
          </span>
          <h2 id="sample-story-title">{story.title}</h2>
          <p>{page?.text || story.summary}</p>
          <div className="sample-story-dialog-actions">
            <button
              type="button"
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              disabled={pageIndex === 0}
            >
              Trang trước
            </button>
            {pageIndex < pageCount - 1 ? (
              <button
                type="button"
                className="is-primary"
                onClick={() => setPageIndex((current) => current + 1)}
              >
                Trang tiếp theo
              </button>
            ) : (
              <button type="button" className="is-primary" onClick={closeDialog}>
                Đọc xong
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
