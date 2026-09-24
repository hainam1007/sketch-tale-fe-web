import { BookOpen, ChartLineUp, CheckCircle, Clock } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
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

  if (progressQuery.isLoading) return <LoadingState label="Đang tải tiến độ học tập" />;
  if (progressQuery.isError) return <ErrorState title="Không thể tải tiến độ" message={progressQuery.error.message} onRetry={() => progressQuery.refetch()} />;

  const data = progressQuery.data;
  const summary = data.summary;
  const cards = [
    { label: "Phút đọc", value: summary.readingMinutes, icon: Clock, suffix: "phút" },
    { label: "Truyện hoàn thành", value: summary.storiesCompleted, icon: BookOpen, suffix: "truyện" },
    { label: "Từ vựng đã ôn", value: summary.vocabularyReviewed, icon: CheckCircle, suffix: "từ" },
    { label: "Độ chính xác quiz", value: summary.quizAccuracy === null ? "Chưa có" : `${summary.quizAccuracy}%`, icon: ChartLineUp, suffix: "" },
  ];

  return (
    <div className="progress-page">
      <div className="progress-page-heading">
        <div>
          <p className="workspace-eyebrow">TIẾN ĐỘ CỦA {child.displayName.toUpperCase()}</p>
          <h2>Những bước nhỏ đang thành câu chuyện</h2>
          <p>Số liệu đọc, từ vựng và quiz được lấy theo khoảng thời gian từ progress API.</p>
        </div>
        <label className="data-range-control">
          <span>Khoảng thời gian</span>
          <select id="progress-range" aria-label="Khoảng thời gian tiến độ" value={range} onChange={changeRange}>
            {rangeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {!data.hasData ? (
        <EmptyState icon={ChartLineUp} title="Chưa có dữ liệu học tập" message="Khi bé hoàn thành một lượt đọc hoặc quiz, tiến độ sẽ xuất hiện ở đây. Số 0 được giữ riêng với trạng thái chưa có dữ liệu." />
      ) : (
        <>
          <div className="workspace-stat-grid progress-stat-grid">
            {cards.map(({ label, value, icon: Icon, suffix }) => <article className="workspace-stat-card" key={label}><span className="workspace-stat-icon"><Icon size={21} aria-hidden="true" /></span><span className="workspace-stat-label">{label}</span><strong>{value}</strong>{suffix && <small>{suffix}</small>}</article>)}
          </div>
          <section className="analytics-card progress-history-card">
            <div className="analytics-card-heading"><div><p className="workspace-eyebrow">LỊCH SỬ GẦN ĐÂY</p><h3>Nhịp đọc theo ngày</h3></div><span className="analytics-card-note">{data.label}</span></div>
            <div className="analytics-table-wrap"><table className="analytics-table"><caption className="sr-only">Lịch sử đọc của {child.displayName}</caption><thead><tr><th>Ngày</th><th>Phút đọc</th><th>Truyện xong</th><th>Từ vựng</th><th>Quiz</th></tr></thead><tbody>{data.days.map((day) => <tr key={day.date}><th scope="row">{day.label}</th><td>{day.readingMinutes}</td><td>{day.storiesCompleted}</td><td>{day.vocabularyReviewed}</td><td>{day.quizAccuracy === null ? "Chưa có" : `${day.quizAccuracy}%`}</td></tr>)}</tbody></table></div>
          </section>
          {data.latestActivity && <p className="progress-latest"><CheckCircle size={17} aria-hidden="true" /> Gần nhất: <strong>{data.latestActivity.title}</strong> · {data.latestActivity.type}</p>}
        </>
      )}
    </div>
  );
}
