import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { queryKeys } from "../../../lib/api/queryKeys";
import { LoadingState } from "../../../components/feedback/States";
import { contentService } from "../services/contentService";
import { EditorPanel } from "../components/StoryEditorParts";
import { useContentAssets, useStoryEditorData } from "../hooks/useStoryEditor";
import StoryPageRenderer from "../components/StoryPageRenderer";

export default function StoryPreviewPage() {
  const { user } = useAuth();
  const { story, storyId } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const previewQuery = useQuery({ queryKey: queryKeys.storyPreview(user.id, storyId), queryFn: ({ signal }) => contentService.previewStory({ storyId, signal }) });
  const preview = previewQuery.data || story;
  const [selectedId, setSelectedId] = useState(story.pages[0]?.id || "");
  const pages = preview.pages || [];
  const currentIndex = Math.max(0, pages.findIndex((page) => page.id === selectedId));
  const currentPage = pages[currentIndex] || pages[0];
  const assets = assetsQuery.data?.items || [];
  const currentVocabulary = (preview.vocabulary || []).filter((item) => item.pageId === currentPage?.id);
  const currentQuizzes = (preview.quizzes || []).filter((item) => item.pageId === currentPage?.id);

  function selectPage(id) {
    setSelectedId(id);
  }

  function movePage(direction) {
    const next = currentIndex + direction;
    if (next >= 0 && next < pages.length) setSelectedId(pages[next].id);
  }

  if (previewQuery.isLoading || assetsQuery.isLoading) return <LoadingState label="Đang dựng preview story" />;

  return (
    <EditorPanel eyebrow="PREVIEW" title="Đọc thử bản đã lưu" description="Preview sử dụng cùng pages, roles, slots, vocabulary và quiz của draft hiện tại. Version đã publish chỉ thay đổi sau thao tác Publish." action={<span className="story-editor-count"><Eye size={17} aria-hidden="true" /> Draft #{preview.revision ?? "—"}</span>}>
      {previewQuery.isError ? <div className="story-preview-error" role="alert">Không thể dựng preview: {previewQuery.error.message}</div> : pages.length ? <div className="story-preview-layout">
        <aside className="story-preview-navigation"><div className="story-preview-section-label">Các page</div>{pages.map((page, index) => <button className={page.id === currentPage.id ? "active" : ""} type="button" key={page.id} onClick={() => selectPage(page.id)}><span>{String(index + 1).padStart(2, "0")}</span>{page.title}</button>)}</aside>
        <div className="story-preview-main">
          <div className="story-preview-toolbar"><button className="icon-button" type="button" aria-label="Page trước" disabled={currentIndex === 0} onClick={() => movePage(-1)}><ArrowLeft size={17} aria-hidden="true" /></button><span>Page {currentIndex + 1} / {pages.length}</span><button className="icon-button" type="button" aria-label="Page sau" disabled={currentIndex === pages.length - 1} onClick={() => movePage(1)}><ArrowRight size={17} aria-hidden="true" /></button></div>
          <StoryPageRenderer story={preview} page={currentPage} assets={assets} />
          <div className="story-preview-learning">
            <section aria-labelledby="preview-vocabulary-title"><div className="story-preview-learning-heading"><p className="workspace-eyebrow">TỪ VỰNG</p><strong id="preview-vocabulary-title">Từ trong page này</strong></div>{currentVocabulary.length ? <ul>{currentVocabulary.map((item) => <li key={item.id}><strong>{item.word}</strong><span>{item.meaning}</span>{item.audioUrl && <audio controls preload="none" src={item.audioUrl} aria-label={`Nghe cách đọc ${item.word}`} />}</li>)}</ul> : <p className="story-preview-learning-empty">Page này chưa có từ vựng.</p>}</section>
            <section aria-labelledby="preview-quiz-title"><div className="story-preview-learning-heading"><p className="workspace-eyebrow">QUIZ</p><strong id="preview-quiz-title">Câu hỏi sau khi đọc</strong></div>{currentQuizzes.length ? currentQuizzes.map((quiz) => <article className="story-preview-quiz" key={quiz.id}><strong>{quiz.question}</strong><ol>{quiz.options.map((option, index) => <li className={index === quiz.correctIndex ? "quiz-answer-correct" : ""} key={`${quiz.id}-${index}`}>{option}</li>)}</ol>{quiz.feedback && <p>{quiz.feedback}</p>}</article>) : <p className="story-preview-learning-empty">Page này chưa có quiz.</p>}</section>
          </div>
          <p className="story-preview-footnote">Preview chỉ đọc dữ liệu draft. Hãy quay lại tab tương ứng để sửa rồi lưu, sau đó Validate trước khi publish.</p>
        </div>
      </div> : <div className="editor-empty"><p>Chưa có page để preview.</p><p>Thêm page có nội dung trước khi dựng trải nghiệm đọc.</p></div>}
    </EditorPanel>
  );
}
