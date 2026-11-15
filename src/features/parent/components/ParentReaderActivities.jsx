import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { getReaderQuizzes, getReaderVocabulary } from "../services/parentReaderActivities";

// Practice only. No reading-log/scoring mutation or Child impersonation.
export default function ParentReaderActivities({ story, page, isLastPage }) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState({});
  const vocabulary = useQuery({ queryKey: ["reader-vocabulary", user.id, story.id, page.id], queryFn: ({ signal }) => getReaderVocabulary({ pageId: page.id, signal }) });
  const quizzes = useQuery({ queryKey: ["reader-quizzes", user.id, story.id, story.pages.map(item => item.compositionJson)], queryFn: ({ signal }) => getReaderQuizzes({ story, signal }) });
  const visibleQuizzes = (quizzes.data || []).filter(quiz => quiz.pageId === page.id || (!quiz.pageId && isLastPage));
  return <section className="parent-reader-activities" aria-label="Cùng bé ôn lại">
    {[vocabulary, quizzes].some(query => query.isPending) && <p role="status">Đang tải từ vựng và câu hỏi…</p>}
    {[vocabulary, quizzes].map((query, index) => query.isError && <p role="alert" key={index}>{query.error.message} <button className="parent-text-link" onClick={() => query.refetch()}>Thử tải lại {index === 0 ? "từ vựng" : "câu hỏi"}</button></p>)}
    {!!vocabulary.data?.length && <section className="family-panel"><h2>Từ vựng trang này</h2><dl>{vocabulary.data.map(word => <div key={word.id}><dt><strong>{word.word}</strong></dt><dd>{word.meaning}{word.audioUrl && <audio controls preload="none" src={word.audioUrl} aria-label={`Nghe từ ${word.word}`} />}</dd></div>)}</dl></section>}
    {!!visibleQuizzes.length && <section className="family-panel"><h2>Cùng bé trả lời</h2><p>Luyện tập khi đọc; kết quả chưa được lưu vào hồ sơ học tập.</p>{visibleQuizzes.map(quiz => <fieldset key={quiz.id}><legend>{quiz.question}</legend>{quiz.imageUrl && <img src={quiz.imageUrl} alt="Hình minh họa câu hỏi" />}{quiz.audioUrl && <audio controls preload="none" src={quiz.audioUrl} aria-label={`Nghe câu hỏi ${quiz.question}`} />}<div className="parent-reader-answer-options">{quiz.options.map((option, index) => <button type="button" className="workspace-button workspace-button-quiet" key={index} aria-pressed={answers[quiz.id] === index} onClick={() => setAnswers(current => ({ ...current, [quiz.id]: index }))}>{option}</button>)}</div>{Object.hasOwn(answers, quiz.id) && <p role="status">{answers[quiz.id] === quiz.correctIndex ? "Đúng rồi!" : "Bé thử lại nhé."}{quiz.feedback && ` ${quiz.feedback}`}</p>}</fieldset>)}</section>}
  </section>;
}
