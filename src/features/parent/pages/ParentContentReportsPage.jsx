import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { ErrorState, LoadingState, EmptyState } from "../../../components/feedback/States";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { parentContentReportService } from "../services/parentContentReportService";
import "../parent-content-reports.css";

const statusLabels = { 0: "Chờ xử lý", 1: "Đang xem xét", 2: "Đã giải quyết", 3: "Không vi phạm" };
const statusStyles = { 0: "pending", 1: "processing", 2: "resolved", 3: "dismissed" };

function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

export default function ParentContentReportsPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["parent-content-reports", user?.id],
    queryFn: ({ signal }) => parentContentReportService.listMine({ userId: user?.id, signal }),
    enabled: moduleApiModes.parentContentReports === "real" && Boolean(user?.id),
  });

  return (
    <div className="parent-page parent-content-reports-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / AN TOÀN NỘI DUNG</p>
          <h1>Báo cáo nội dung của tôi</h1>
          <p>Theo dõi kết quả xem xét nội dung bạn đã gửi.</p>
        </div>
        <Link className="workspace-button workspace-button-quiet" to="/parent/library">Về thư viện truyện</Link>
      </header>
      {moduleApiModes.parentContentReports !== "real" ? (
        <section className="parent-content-reports-state"><h2>API báo cáo chưa được bật</h2><p>Luồng này cần backend có bản cập nhật quyền và xử lý report.</p></section>
      ) : query.isPending ? <LoadingState label="Đang tải báo cáo" /> : query.isError ? (
        <ErrorState title="Không thể tải báo cáo" message={query.error.message} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState title="Chưa có báo cáo nội dung" message="Bạn có thể gửi báo cáo trong lúc xem một câu chuyện." />
      ) : (
        <section className="parent-content-report-list" aria-label="Danh sách báo cáo nội dung">
          {query.data.map((report) => (
            <article className="parent-content-report-row" key={report.id}>
              <div>
                <p className="workspace-eyebrow">TRUYỆN · {formatDate(report.createdAt)}</p>
                <h2>{report.targetTitle || "Nội dung truyện"}</h2>
                <p>{report.reason}</p>
              </div>
              <span className={`parent-content-report-status is-${statusStyles[report.status] || "pending"}`}>
                {statusLabels[report.status] || "Chưa xác định"}
              </span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
