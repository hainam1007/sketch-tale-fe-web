import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Sparkle, XCircle } from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import { getReaderQuizzes, getReaderVocabulary } from "../services/parentReaderActivities";

// Practice only. No reading-log/scoring mutation or Child impersonation.
export default function ParentReaderActivities({ story, page, isLastPage, isPageComplete = false }) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState({});
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [quizDismissed, setQuizDismissed] = useState(false);
  const vocabulary = useQuery({ queryKey: ["reader-vocabulary", user.id, story.id, page.id], queryFn: ({ signal }) => getReaderVocabulary({ pageId: page.id, signal }) });
  const quizzes = useQuery({ queryKey: ["reader-quizzes", user.id, story.id, story.pages.map(item => item.compositionJson)], queryFn: ({ signal }) => getReaderQuizzes({ story, signal }) });
  const visibleQuizzes = (quizzes.data || []).filter(quiz => quiz.pageId === page.id || (!quiz.pageId && isLastPage));
  const activeQuiz = visibleQuizzes[activeQuizIndex];
  const hasAnswered = activeQuiz && Object.prototype.hasOwnProperty.call(answers, activeQuiz.id);
  const isCorrect = hasAnswered && Number(answers[activeQuiz.id]) === Number(activeQuiz.correctIndex);
  const showQuiz = isPageComplete && !quizDismissed && Boolean(activeQuiz);

  function answerQuiz(optionIndex) {
    setAnswers(current => ({ ...current, [activeQuiz.id]: optionIndex }));
  }

  function continueQuiz() {
    if (!isCorrect) {
      setAnswers(current => {
        const next = { ...current };
        delete next[activeQuiz.id];
        return next;
      });
      return;
    }
    if (activeQuizIndex < visibleQuizzes.length - 1) setActiveQuizIndex(index => index + 1);
    else setQuizDismissed(true);
  }

  return <section className="parent-reader-activities" aria-label="Cùng bé ôn lại">
    {[vocabulary, quizzes].some(query => query.isPending) && <p role="status">Đang tải từ vựng và câu hỏi…</p>}
    {[vocabulary, quizzes].map((query, index) => query.isError && <p role="alert" key={index}>{query.error.message} <button className="parent-text-link" onClick={() => query.refetch()}>Thử tải lại {index === 0 ? "từ vựng" : "câu hỏi"}</button></p>)}
    {!!vocabulary.data?.length && <section className="family-panel"><h2>Từ vựng trang này</h2><dl>{vocabulary.data.map(word => <div key={word.id}><dt><strong>{word.word}</strong></dt><dd>{word.meaning}{word.audioUrl && <audio controls preload="none" src={word.audioUrl} aria-label={`Nghe từ ${word.word}`} />}</dd></div>)}</dl></section>}
    {showQuiz && <div className="parent-reader-quiz-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setQuizDismissed(true); }}>
      <section className="parent-reader-quiz-dialog" role="dialog" aria-modal="true" aria-labelledby="parent-reader-quiz-title" onKeyDown={event => { if (event.key === "Escape") setQuizDismissed(true); }}>
        <div className="parent-reader-quiz-heading">
          <span className="parent-reader-quiz-icon"><Sparkle size={23} weight="fill" aria-hidden="true" /></span>
          <span className="parent-reader-quiz-count">Câu {activeQuizIndex + 1} / {visibleQuizzes.length}</span>
        </div>
        <p className="parent-reader-quiz-eyebrow">CÙNG BÉ ÔN LẠI</p>
        <h2 id="parent-reader-quiz-title">Bé nhớ câu chuyện chứ?</h2>
        <p className="parent-reader-quiz-question">{activeQuiz.question}</p>
        {activeQuiz.imageUrl && <img className="parent-reader-quiz-image" src={activeQuiz.imageUrl} alt="Minh họa cho câu hỏi" />}
        {activeQuiz.audioUrl && <audio className="parent-reader-quiz-audio" controls preload="none" src={activeQuiz.audioUrl} aria-label={`Nghe câu hỏi ${activeQuiz.question}`} />}
        <div className="parent-reader-quiz-options">
          {activeQuiz.options.map((option, index) => {
            const selected = hasAnswered && Number(answers[activeQuiz.id]) === index;
            const correct = index === Number(activeQuiz.correctIndex);
            const resultClass = hasAnswered && selected ? (isCorrect ? " is-correct" : " is-incorrect") : "";
            return <button className={`parent-reader-quiz-option${resultClass}`} key={`${activeQuiz.id}-${index}`} type="button" aria-pressed={selected} onClick={() => answerQuiz(index)}>
              <span className="parent-reader-quiz-option-letter">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
              {hasAnswered && selected && (isCorrect ? <CheckCircle size={21} weight="fill" aria-hidden="true" /> : <XCircle size={21} weight="fill" aria-hidden="true" />)}
              {hasAnswered && !isCorrect && correct && <CheckCircle className="parent-reader-quiz-correct-hint" size={20} weight="fill" aria-label="Đáp án đúng" />}
            </button>;
          })}
        </div>
        {hasAnswered && <div className={`parent-reader-quiz-feedback${isCorrect ? " is-correct" : " is-incorrect"}`} role="status" aria-live="polite">
          {isCorrect ? <CheckCircle size={23} weight="fill" aria-hidden="true" /> : <XCircle size={23} weight="fill" aria-hidden="true" />}
          <div><strong>{isCorrect ? "Tuyệt lắm, chính xác rồi!" : "Chưa đúng, mình thử lại nhé!"}</strong><span>{isCorrect ? (activeQuiz.feedback || "Bé nhớ rất tốt nội dung câu chuyện.") : "Bé chọn một đáp án khác nha."}</span></div>
        </div>}
        <div className="parent-reader-quiz-actions">
          <button className="workspace-button workspace-button-quiet" type="button" onClick={() => setQuizDismissed(true)}>Để sau</button>
          {hasAnswered && <button className="workspace-button" type="button" onClick={continueQuiz}>
            {isCorrect ? (activeQuizIndex < visibleQuizzes.length - 1 ? "Câu tiếp theo" : "Hoàn thành") : "Thử lại"}
          </button>}
        </div>
      </section>
    </div>}
  </section>;
}
