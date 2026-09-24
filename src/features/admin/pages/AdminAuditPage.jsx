import { MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";

const ranges = [["7d", "7 ngày gần đây"], ["30d", "30 ngày gần đây"], ["all", "Tất cả thời gian"]];

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = { actor: searchParams.get("actor") || "all", action: searchParams.get("action") || "all", range: searchParams.get("range") || "30d", search: searchParams.get("search") || "" };
  const auditQuery = useQuery({ queryKey: queryKeys.adminAudit(user.id, filters), queryFn: ({ signal }) => adminService.listAudit({ ...filters, signal }) });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "range" && value === "30d")) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  if (auditQuery.isLoading) return <LoadingState label="Đang tải audit viewer" />;
  if (auditQuery.isError) return <ErrorState title="Không thể tải audit viewer" message={auditQuery.error.message} onRetry={() => auditQuery.refetch()} />;
  const options = auditQuery.data.filters;

  return <div className="workspace-dashboard audit-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / AUDIT VIEWER</p><h1>Lịch sử thao tác</h1><p>Audit chỉ đọc, có thể lọc theo actor, action, thời gian và target.</p></div><ShieldCheck size={43} className="admin-heading-icon" aria-hidden="true" /></div><div className="audit-filter-panel"><label><span>Actor</span><select aria-label="Lọc actor" value={filters.actor} onChange={(event) => updateFilter("actor", event.target.value)}><option value="all">Tất cả actor</option>{options.actors.map((actor) => <option value={actor} key={actor}>{actor}</option>)}</select></label><label><span>Action</span><select aria-label="Lọc action" value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}><option value="all">Tất cả action</option>{options.actions.map((action) => <option value={action} key={action}>{action}</option>)}</select></label><label><span>Khoảng thời gian</span><select aria-label="Khoảng thời gian audit" value={filters.range} onChange={(event) => updateFilter("range", event.target.value)}>{ranges.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="audit-search"><span>Tìm target</span><div><MagnifyingGlass size={15} aria-hidden="true" /><input aria-label="Tìm audit" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Tên target hoặc actor" /></div></label></div><section className="analytics-card audit-table-card"><div className="analytics-card-heading"><div><h2>Event đã ghi nhận</h2><p>{auditQuery.data.total} event phù hợp bộ lọc.</p></div></div>{auditQuery.data.items.length ? <div className="analytics-table-wrap"><table className="analytics-table audit-table"><caption className="sr-only">Danh sách audit event</caption><thead><tr><th>Thời gian</th><th>Actor</th><th>Action</th><th>Target</th><th>Trạng thái</th></tr></thead><tbody>{auditQuery.data.items.map((item) => <tr key={item.id}><td>{formatDateTime(item.createdAt)}</td><td><strong>{item.actorName}</strong><small>{item.actor}</small></td><td><code>{item.action}</code></td><td>{item.target}</td><td><span className="workspace-badge workspace-badge-success">Thành công</span></td></tr>)}</tbody></table></div> : <div className="workspace-state workspace-state-empty"><ShieldCheck size={29} aria-hidden="true" /><strong>Không có event phù hợp</strong><p>Thử đổi actor, action hoặc khoảng thời gian.</p></div>}</section></div>;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
