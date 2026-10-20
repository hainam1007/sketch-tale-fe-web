import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeSlash, Pause, Play, SpeakerHigh } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { queryKeys } from "../../../lib/api/queryKeys";
import { LoadingState } from "../../../components/feedback/States";
import { contentService } from "../services/contentService";
import { EditorPanel } from "../components/StoryEditorParts";
import { useContentAssets, useStoryEditorData } from "../hooks/useStoryEditor";
import StoryPageRenderer from "../components/StoryPageRenderer";
import { animationDuration } from "../utils/storyAnimation";
import { normalizeStoryAudioTracks, stopStoryAudio, syncStoryAudio } from "../utils/storyAudio";
const EMPTY_ASSETS = [];

export default function StoryPreviewPage() {
  const { user } = useAuth();
  const { story, storyId } = useStoryEditorData();
  const assetsQuery = useContentAssets();
  const previewQuery = useQuery({ queryKey: queryKeys.storyPreview(user.id, storyId), queryFn: ({ signal }) => contentService.previewStory({ storyId, signal }) });
  const preview = previewQuery.data || story;
  const [selectedId, setSelectedId] = useState(story.pages[0]?.id || "");
  const [mode, setMode] = useState("read");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [audioError, setAudioError] = useState("");
  const [playToken, setPlayToken] = useState(0);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [audioDurations, setAudioDurations] = useState({});
  const audioPlayersRef = useRef(new Map());
  const timerRef = useRef(null);
  const autoPlayRef = useRef(false);
  const playbackStartedAtRef = useRef(0);
  const playheadStartRef = useRef(0);
  const playheadRef = useRef(0);
  const pages = useMemo(() => (preview.pages || []).map((page) => ({ ...page, audioTracks: normalizeStoryAudioTracks(page.audioTracks || []) })), [preview.pages]);
  const currentIndex = Math.max(0, pages.findIndex((page) => page.id === selectedId));
  const currentPage = pages[currentIndex] || pages[0];
  const assets = assetsQuery.data?.items || EMPTY_ASSETS;
  const currentDuration = currentPage ? animationDuration(currentPage, audioDurations) : 3000;
  const currentVocabulary = (preview.vocabulary || []).filter((item) => item.pageId === currentPage?.id);
  const currentQuizzes = (preview.quizzes || []).filter((item) => item.pageId === currentPage?.id);

  const updatePlayhead = useCallback((value) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    playheadRef.current = next;
    setPlayheadMs(next);
  }, []);

  const syncPageAudio = useCallback((page, timeMs, shouldPlay) => {
    syncStoryAudio(audioPlayersRef.current, page?.audioTracks || [], assets, timeMs, shouldPlay, (name) => { setAudioError(`Không phát được ${name}. Kiểm tra tệp âm thanh rồi thử lại.`); setIsPlaying(false); }, (id, length) => setAudioDurations((previous) => previous[id] === length ? previous : { ...previous, [id]: length }), muted);
  }, [assets, muted]);

  const playPageAt = useCallback((index) => {
    const page = pages[index];
    if (!page) return setIsPlaying(false);
    stopStoryAudio(audioPlayersRef.current);
    window.clearTimeout(timerRef.current);
    setSelectedId(page.id);
    updatePlayhead(0);
    setAudioError("");
    setPlayToken((token) => token + 1);
    syncPageAudio(page, 0, true);
    setIsPlaying(true);
  }, [pages, syncPageAudio, updatePlayhead]);
  const finishPage = useCallback((index) => {
    const page = pages[index];
    if (page) {
      const end = animationDuration(page, audioDurations);
      updatePlayhead(end);
      syncPageAudio(page, end, false);
    }
    if (autoPlayRef.current && index < pages.length - 1) {
      setIsPlaying(false);
      timerRef.current = window.setTimeout(() => playPageAt(index + 1), 350);
    } else setIsPlaying(false);
  }, [pages, audioDurations, syncPageAudio, playPageAt, updatePlayhead]);
  useEffect(() => () => {
    stopStoryAudio(audioPlayersRef.current);
    window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying || !currentPage) return undefined;
    playbackStartedAtRef.current = performance.now();
    playheadStartRef.current = playheadRef.current;
    let frame = 0;
    const duration = currentDuration;
    const tick = (now) => {
      const time = playheadStartRef.current + now - playbackStartedAtRef.current;
      const current = Math.min(duration, time);
      playheadRef.current = current;
      setPlayheadMs(current);
      syncPageAudio(currentPage, current, time < duration);
      if (time < duration) frame = window.requestAnimationFrame(tick);
      else finishPage(currentIndex);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isPlaying, selectedId, currentDuration, currentPage, currentIndex, syncPageAudio, finishPage]);

  useEffect(() => {
    if (isPlaying || !currentPage) return;
    syncPageAudio(currentPage, playheadMs, false);
  }, [isPlaying, selectedId, currentPage, playheadMs, syncPageAudio]);


  function stopPlayback() {
    stopStoryAudio(audioPlayersRef.current);
    window.clearTimeout(timerRef.current);
    setIsPlaying(false);
  }



  function togglePlayback() {
    if (isPlaying) {
      if (currentPage) syncPageAudio(currentPage, playheadMs, false);
      window.clearTimeout(timerRef.current);
      setIsPlaying(false);
      return;
    }
    if (!currentPage || playheadMs >= currentDuration) return playPageAt(currentIndex);
    syncPageAudio(currentPage, playheadMs, true);
    setIsPlaying(true);
  }

  function selectPage(id) {
    stopPlayback();
    updatePlayhead(0);
    setQuizAnswers({});
    setSelectedId(id);
  }

  function movePage(direction) {
    const next = currentIndex + direction;
    if (next >= 0 && next < pages.length) { stopPlayback(); updatePlayhead(0); setQuizAnswers({}); setSelectedId(pages[next].id); }
  }

  if (previewQuery.isLoading || assetsQuery.isLoading) return <LoadingState label="Đang dựng bản xem trước" />;

  return (
    <EditorPanel eyebrow="XEM TRƯỚC" title="Đọc thử bản đã lưu" description="Đi qua từng trang, nghe âm thanh và kiểm tra từ vựng cùng câu hỏi trong ngữ cảnh." action={<div className="story-preview-header-actions"><span className="story-editor-count"><Eye size={17} aria-hidden="true" /> Bản hiện tại · lần chỉnh sửa #{preview.revision ?? "—"}</span><div className="story-preview-mode-switch" role="group" aria-label="Chế độ xem trước"><button className={mode === "read" ? "active" : ""} type="button" aria-pressed={mode === "read"} onClick={() => setMode("read")}><Eye size={16} aria-hidden="true" /> Đọc thử</button><button className={mode === "inspect" ? "active" : ""} type="button" aria-label="Rà soát bản xem trước" aria-pressed={mode === "inspect"} onClick={() => setMode("inspect")}><EyeSlash size={16} aria-hidden="true" /> Kiểm tra</button></div></div>}>
      {assetsQuery.isError && <div className="story-preview-error" role="alert">Không thể tải thư viện tư liệu: {assetsQuery.error?.message} <button className="workspace-text-link" type="button" onClick={() => assetsQuery.refetch()}>Thử lại</button></div>}{previewQuery.isError ? <div className="story-preview-error" role="alert">Không thể dựng bản xem trước: {previewQuery.error.message} <button className="workspace-text-link" type="button" onClick={() => previewQuery.refetch()}>Thử lại</button></div> : pages.length ? <div className="story-preview-layout">
        <aside className="story-preview-navigation"><div className="story-preview-section-label">Các trang</div>{pages.map((page, index) => <button className={page.id === currentPage.id ? "active" : ""} type="button" key={page.id} onClick={() => selectPage(page.id)}><span>{String(index + 1).padStart(2, "0")}</span>{page.title}</button>)}</aside>
        <div className="story-preview-main">
          <div className="story-preview-toolbar"><button className="icon-button" type="button" aria-label="Trang trước" disabled={currentIndex === 0} onClick={() => movePage(-1)}><ArrowLeft size={17} aria-hidden="true" /></button><span>Trang {currentIndex + 1} / {pages.length}</span><button className="icon-button" type="button" aria-label="Trang sau" disabled={currentIndex === pages.length - 1} onClick={() => movePage(1)}><ArrowRight size={17} aria-hidden="true" /></button><button className="workspace-button workspace-button-quiet" type="button" onClick={togglePlayback}>{isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{isPlaying ? "Tạm dừng" : playheadMs > 0 ? "Tiếp tục" : "Phát trang"}</button>{playheadMs > 0 && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => playPageAt(currentIndex)}>Phát lại</button>}<button className="workspace-button workspace-button-quiet" type="button" aria-pressed={muted} onClick={() => setMuted((value) => !value)}><SpeakerHigh size={15} aria-hidden="true" />{muted ? "Bật tiếng" : "Tắt tiếng"}</button><label className="story-preview-autoplay"><input type="checkbox" checked={autoPlay} onChange={(event) => { autoPlayRef.current = event.target.checked; setAutoPlay(event.target.checked); }} /> Tự phát các trang</label></div>
          {currentPage.text?.trim() && <section className="story-preview-subtitles" aria-label="Phụ đề trang này"><h3>Phụ đề</h3><p>{currentPage.text}</p></section>}
          {audioError && <p className="story-preview-error" role="alert">{audioError}</p>}
          <StoryPageRenderer story={preview} page={currentPage} assets={assets} isPlaying={isPlaying} playToken={playToken} playheadMs={playheadMs} showPageText={false} />
          <p className="story-preview-mode-note" role="status">{mode === "read" ? "Đọc thử không hiển thị đáp án đúng trước khi trả lời." : "Kiểm tra nội dung hiển thị đáp án và ngữ cảnh để rà soát trước khi xuất bản."}</p>
          <div className="story-preview-learning">
            <section aria-labelledby="preview-vocabulary-title"><div className="story-preview-learning-heading"><p className="workspace-eyebrow">TỪ VỰNG</p><strong id="preview-vocabulary-title">Từ trong trang này</strong></div>{currentVocabulary.length ? <ul>{currentVocabulary.map((item) => <li key={item.id}><strong>{item.word}</strong><span>{item.meaning}</span>{item.audioUrl && <audio controls preload="none" src={item.audioUrl} aria-label={`Nghe cách đọc ${item.word}`} />}</li>)}</ul> : <p className="story-preview-learning-empty">Trang này chưa có từ vựng.</p>}</section>
            <section aria-labelledby="preview-quiz-title"><div className="story-preview-learning-heading"><p className="workspace-eyebrow">CÂU HỎI</p><strong id="preview-quiz-title">Câu hỏi sau khi đọc</strong></div>{currentQuizzes.length ? currentQuizzes.map((quiz) => {
              const hasAnswered = Object.prototype.hasOwnProperty.call(quizAnswers, quiz.id);
              const isCorrect = Number(quizAnswers[quiz.id]) === Number(quiz.correctIndex);
              return <article className="story-preview-quiz" key={quiz.id}><strong>{quiz.question}</strong><ol>{quiz.options.map((option, index) => <li className={`${mode === "read" ? "story-preview-option" : ""}${(mode === "inspect" || (mode === "read" && hasAnswered && Number(quizAnswers[quiz.id]) === index && isCorrect)) && index === quiz.correctIndex ? " quiz-answer-correct" : ""}`} key={`${quiz.id}-${index}`}>{mode === "read" ? <button type="button" aria-pressed={hasAnswered && Number(quizAnswers[quiz.id]) === index} onClick={() => setQuizAnswers((previous) => ({ ...previous, [quiz.id]: index }))}>{option}</button> : <>{option}{index === quiz.correctIndex && <span className="story-preview-answer-label">Đáp án đúng</span>}</>}</li>)}</ol>{mode === "read" && hasAnswered && <p className={`story-preview-quiz-feedback${isCorrect ? " is-correct" : ""}`} role="status">{isCorrect ? (quiz.feedback || "Chính xác! Bé đã chọn đúng.") : "Chưa đúng. Bé thử chọn lại nhé!"}</p>}{mode === "inspect" && quiz.feedback && <p>{quiz.feedback}</p>}</article>;
            }) : <p className="story-preview-learning-empty">Trang này chưa có câu hỏi.</p>}</section>
          </div>
        </div>
      </div> : <div className="editor-empty"><p>Chưa có trang để xem trước.</p><p>Thêm trang có nội dung để dựng trải nghiệm đọc.</p></div>}
    </EditorPanel>
  );
}
