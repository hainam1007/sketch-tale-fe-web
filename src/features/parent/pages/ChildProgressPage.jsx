import { BookOpen, ChartLineUp, CheckCircle, Clock, Brain, Star } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { childrenService } from "../services/childrenService";
import { parentQuizResultService } from "../services/parentQuizResultService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";

const rangeOptions = [
  ["7d", "7 ngày gần đây"],
  ["30d", "30 ngày gần đây"],
];

export default function ChildProgressPage() {
  const { user } = useAuth();
  const { child } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") || "30d";
  const progressQuery = useQuery({
    queryKey: queryKeys.childProgress(user.id, child.id, range),
    queryFn: ({ signal }) => childrenService.getProgress({ childId: child.id, range, signal }),
  });

  function changeRange(event) {
    setSearchParams({ range: event.target.value });
  }

  const data = progressQuery.data;
  const summary = data?.summary;
  const cards = [
    { label: "Phút đọc", value: summary?.readingMinutes, icon: Clock, suffix: "phút" },
    { label: "Truyện hoàn thành", value: summary?.storiesCompleted, icon: BookOpen, suffix: "truyện" },
    { label: "Từ vựng đã ôn", value: summary?.vocabularyReviewed, icon: CheckCircle, suffix: "từ" },
    { label: "Độ chính xác quiz", value: summary?.quizAccuracy == null ? "Chưa có" : `${summary.quizAccuracy}%`, icon: ChartLineUp, suffix: "" },
  ];

  return (
    <div className="progress-page">
      <div className="progress-page-heading">
        <div>
          <p className="workspace-eyebrow">TIẾN ĐỘ CỦA {child.displayName.toUpperCase()}</p>
          <h2>Những bước nhỏ đang thành câu chuyện</h2>
          <p>Số liệu đọc, từ vựng và câu hỏi sau truyện trong khoảng thời gian đã chọn.</p>
        </div>
        <label className="data-range-control">
          <span>Khoảng thời gian</span>
          <select id="progress-range" aria-label="Khoảng thời gian tiến độ" value={range} onChange={changeRange}>
            {rangeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="progress-demo-note" role="note">Số liệu phút đọc, truyện và từ vựng bên dưới là dữ liệu minh họa. Kết quả quiz được tải riêng từ API khi tính năng này được bật.</p>
      {progressQuery.isPending ? <LoadingState label="Đang tải phần tổng quan" /> : progressQuery.isError ? <ErrorState title="Không thể tải phần tổng quan" message={progressQuery.error.message} onRetry={() => progressQuery.refetch()} /> : !data.hasData ? (
        <EmptyState icon={ChartLineUp} title="Chưa có dữ liệu tổng quan" message="Phần phút đọc, truyện hoàn thành và từ vựng hiện chưa có dữ liệu thật." />
      ) : (
        <>
          <div className="workspace-stat-grid progress-stat-grid">
            {cards.map(({ label, value, icon: Icon, suffix }) => <article className="workspace-stat-card" key={label}><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{value}</strong>{suffix && <small>{suffix}</small>}</article>)}
          </div>
          <section className="analytics-card progress-history-card">
            <div className="analytics-card-heading"><div><p className="workspace-eyebrow">LỊCH SỬ GẦN ĐÂY</p><h3>Nhịp đọc theo ngày</h3></div><span className="analytics-card-note">{data.label}</span></div>
            <div className="analytics-table-wrap"><table className="analytics-table"><caption className="sr-only">Lịch sử đọc minh họa của {child.displayName}</caption><thead><tr><th>Ngày</th><th>Phút đọc</th><th>Truyện hoàn thành</th><th>Từ đã ôn</th><th>Trả lời đúng</th></tr></thead><tbody>{data.days.map((day) => <tr key={day.date}><th scope="row">{day.label}</th><td>{day.readingMinutes}</td><td>{day.storiesCompleted}</td><td>{day.vocabularyReviewed}</td><td>{day.quizAccuracy === null ? "Chưa có" : `${day.quizAccuracy}%`}</td></tr>)}</tbody></table></div>
          </section>
          {data.latestActivity && <p className="progress-latest"><CheckCircle size={17} aria-hidden="true" /> Hoạt động minh họa gần nhất: <strong>{data.latestActivity.title}</strong> · {data.latestActivity.type}</p>}
        </>
      )}
      <LiveQuizHistory child={child} userId={user.id} />
    </div>
  );
}

function formatPercent(value) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

export function LiveQuizHistory({ child, userId }) {
  const quizResultsQuery = useQuery({
    queryKey: queryKeys.childQuizResults(userId, child.id, moduleApiModes.parentQuizResults),
    queryFn: ({ signal }) => parentQuizResultService.listForChild({ childProfileId: child.id, signal }),
    enabled: moduleApiModes.parentQuizResults === "real",
    staleTime: 60_000,
  });
  const hasLiveQuizResults = moduleApiModes.parentQuizResults === "real";

  return (
      <section className="quiz-history-section" aria-labelledby="quiz-history-title">
        <div className="quiz-history-heading">
          <span className="workspace-stat-icon"><Brain size={21} aria-hidden="true" /></span>
          <div>
            <p className="workspace-eyebrow">LỊCH SỬ CÂU HỎI</p>
            <h3 id="quiz-history-title">Các lượt làm quiz</h3>
            <p>Thông tin câu hỏi và đáp án được giữ theo đúng dữ liệu của từng lượt đọc.</p>
          </div>
        </div>
        {!hasLiveQuizResults ? (
          <p className="quiz-history-unavailable" role="note">API kết quả quiz chưa được bật trong môi trường này.</p>
        ) : quizResultsQuery.isPending ? (
          <LoadingState label="Đang tải kết quả quiz" />
        ) : quizResultsQuery.isError ? (
          <ErrorState title="Không thể tải kết quả quiz" message={quizResultsQuery.error.message} onRetry={() => quizResultsQuery.refetch()} />
        ) : quizResultsQuery.data.length === 0 ? (
          <EmptyState icon={Brain} title="Chưa có kết quả quiz" message="Kết quả sẽ xuất hiện sau khi bé nộp câu trả lời trong ứng dụng." />
        ) : (
          <div className="quiz-result-list">
            {quizResultsQuery.data.map((result, resultIndex) => (
              <article className="quiz-result-card" key={result.readingLogId}>
                <div className="quiz-result-summary">
                  <div>
                    <p className="workspace-eyebrow">LƯỢT {resultIndex + 1}</p>
                    <h4>{result.isQuizCompleted ? "Đã hoàn thành" : "Đang làm dở"}</h4>
                    <p>{result.totalAnswered} / {result.totalQuestions} câu đã trả lời · {result.totalCorrectAnswers} câu đúng</p>
                  </div>
                  <div className="quiz-result-score">
                    <strong>{formatPercent(result.accuracyPercentage)}%</strong>
                    <span>độ chính xác</span>
                    {result.isQuizCompleted && <span className="quiz-result-stars" aria-label={`${result.stars} sao`}>{Array.from({ length: result.stars }, (_, index) => <Star key={index} weight="fill" aria-hidden="true" />)}</span>}
                  </div>
                </div>
                <details className="quiz-result-details">
                  <summary>Xem {result.answers.length} câu trả lời</summary>
                  <ol className="quiz-answer-list">
                    {result.answers.map((answer, answerIndex) => (
                      <li className="quiz-answer-item" key={answer.id}>
                        <div className="quiz-answer-title">
                          <strong>{answer.questionText || `Câu ${answerIndex + 1}`}</strong>
                          <span className={answer.isCorrect ? "quiz-answer-correct" : "quiz-answer-incorrect"}>{answer.isCorrect ? "Đúng" : "Chưa đúng"}</span>
                        </div>
                        {answer.questionPicUrl && <img className="quiz-question-image" src={answer.questionPicUrl} alt="Hình minh họa câu hỏi" />}
                        <ul className="quiz-answer-options">
                          {answer.options.map((option, optionIndex) => {
                            const isSelected = optionIndex === answer.selectedOptionIndex;
                            const isCorrect = optionIndex === answer.correctOptionIndex;
                            return <li className={`${isSelected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""}`} key={`${answer.id}-${optionIndex}`}><span>{option}</span>{isSelected && <small>Bé chọn</small>}{isCorrect && <small>Đáp án đúng</small>}</li>;
                          })}
                        </ul>
                        <p className="quiz-answer-time">Thời gian trả lời: {answer.responseTimeSeconds} giây</p>
                      </li>
                    ))}
                  </ol>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
  );
}
