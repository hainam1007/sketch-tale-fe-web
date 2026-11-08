import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Star, CheckCircle, ShieldCheck, Gear } from "@phosphor-icons/react";
import { moduleApiModes } from "../../../lib/api/featureApi";
import { parentApprovalService } from "../services/parentApprovalService";
import ParentApprovalsLive from "./ParentApprovalsLive";
import LiveChildProfilePage from "../pages/LiveChildProfilePage";

// This branch only renders server-backed information. Preview fixtures remain
// in ParentChildExperience and never supply statistics for a real child.
export default function LiveChildSection({ child, userId, section }) {
  const base = `/parent/children/${encodeURIComponent(child.id)}`;
  const isOverview = !section || section === "dashboard";
  const approvalsEnabled = moduleApiModes.parentApprovals === "real";
  const pending = useQuery({
    queryKey: ["child-approvals", userId, child.id, "pending-count", "real"],
    queryFn: ({ signal }) => parentApprovalService.list({ childId: child.id, status: "pending", pageSize: 1, signal }),
    enabled: isOverview && approvalsEnabled,
  });

  if (section === "approvals") {
    return approvalsEnabled
      ? <ParentApprovalsLive child={child} userId={userId} />
      : <Unavailable title="Phê duyệt chưa khả dụng" message="Yêu cầu phê duyệt của bé sẽ xuất hiện khi tính năng sẵn sàng." />;
  }
  if (section === "settings") {
    return <>
      <LiveChildProfilePage childId={child.id} />
      <Unavailable title="Cài đặt mở rộng" message="Mục tiêu đọc, lịch nhắc, chủ đề yêu thích và quyền chia sẻ chưa khả dụng. Bạn có thể cập nhật giới hạn tài khoản ở trên." />
    </>;
  }
  if (section === "library") {
    return <section className="family-panel">
      <h2>Tủ truyện của bé</h2>
      <p>Chưa có dữ liệu tủ truyện riêng của bé để hiển thị.</p>
      <Link className="workspace-button" to="/parent/library">Khám phá thư viện truyện</Link>
    </section>;
  }
  if (!isOverview) return <Unavailable title="Nội dung chưa khả dụng" message="Thông tin sẽ xuất hiện khi tính năng sẵn sàng." />;

  const pendingLabel = !approvalsEnabled ? "Chưa khả dụng"
    : pending.isPending ? "Đang tải yêu cầu…"
      : pending.isError ? "Chưa tải được yêu cầu"
        : `${pending.data.total} yêu cầu chờ bố mẹ`;
  return <>
    <div className="family-metrics">
      {[[Clock, "Thời gian đọc"], [BookOpen, "Truyện hoàn thành"], [Star, "Từ vựng khám phá"], [CheckCircle, "Trả lời đúng"]].map(([Icon, label]) => (
        <article key={label}>
          <Icon size={24} aria-hidden="true" />
          <span>{label}</span>
          <strong aria-label="Chưa có dữ liệu">—</strong>
          <small>Chưa có dữ liệu</small>
        </article>
      ))}
    </div>
    <section className="family-panel">
      <h2>Hành trình đọc của bé</h2>
      <p>Chưa có dữ liệu hoạt động đọc để hiển thị biểu đồ và tiến độ.</p>
    </section>
    <section className="family-panel">
      <div className="family-section-heading"><h2>Bố mẹ có thể làm ngay</h2></div>
      <div className="family-action-grid">
        <Link to={`${base}/approvals`}><ShieldCheck size={25} /><strong>Duyệt nhân vật</strong><span>{pendingLabel}</span></Link>
        <Link to="/parent/library"><BookOpen size={25} /><strong>Chọn truyện đọc cùng bé</strong><span>Khám phá thư viện truyện</span></Link>
        <Link to={`${base}/profile`}><Gear size={25} /><strong>Giới hạn tài khoản</strong><span>Cập nhật hồ sơ và giới hạn của bé</span></Link>
      </div>
      {pending.isError && approvalsEnabled && <button type="button" className="workspace-button workspace-button-quiet" onClick={() => pending.refetch()}>Tải lại số yêu cầu</button>}
    </section>
  </>;
}

function Unavailable({ title, message }) {
  return <section className="family-panel" role="status"><h2>{title}</h2><p>{message}</p></section>;
}
