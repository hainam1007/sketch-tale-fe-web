import { BookOpen } from "@phosphor-icons/react";
import StoryCard from "../StoryCard";
import Reveal from "./Reveal";

export default function StoryLibrarySection({ stories, loading, error }) {
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
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
