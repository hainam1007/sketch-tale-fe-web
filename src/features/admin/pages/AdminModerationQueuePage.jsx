import { useState } from "react";
import { ArrowClockwise, Check, Clock, Prohibit, WarningCircle, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { moderationOwnerId, moderationRuleService, moderationRuleStatuses, moderationStatus, wf05ApiEnabled } from "../../moderation/services/moderationRuleService";
import "../admin.css";

const ruleKinds = [
  { kind: "restrictedKeywords", label: "Từ khóa", field: "keyword", path: "/admin/restrictions" },
  { kind: "prohibitedThemes", label: "Chủ đề cấm", field: "name", path: "/admin/prohibited-themes" },
];

function createdAt(item) {
  if (!item.createdAt || Number.isNaN(new Date(item.createdAt).getTime())) return "Ngày tạo chưa được cung cấp";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(item.createdAt));
}

async function reviewProposal({ kind, id, targetStatus }) {
  let accepted = false;
  try {
    const latest = await moderationRuleService.get({ kind, id });
    if (moderationStatus(latest) !== 1) throw Object.assign(new Error("Đề xuất không còn ở trạng thái chờ duyệt. Tải lại hàng đợi."), { status: 409 });
    await moderationRuleService.update({ kind, id, payload: { ...latest, status: targetStatus } });
    accepted = true;
    const saved = await moderationRuleService.get({ kind, id });
    if (moderationStatus(saved) !== targetStatus) {
      throw Object.assign(new Error("Máy chủ đã nhận quyết định nhưng trạng thái đọc lại chưa khớp. Hãy đối chiếu bằng GET, không gửi lại."), { mutationAccepted: true });
    }
    return saved;
  } catch (error) {
    if (accepted) error.mutationAccepted = true;
    throw error;
  }
}

function isUnknownOutcome(error) {
  return Boolean(error?.mutationAccepted || error?.code === "NETWORK_ERROR" || (Number(error?.status) >= 500));
}

export default function AdminModerationQueuePage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [kindFilter, setKindFilter] = useState("all");
  const [lockedId, setLockedId] = useState(null);
  const [notice, setNotice] = useState("");
  const queryFor = (kind) => ["wf05-moderation-rules", user.id, kind];
  const keywordQuery = useQuery({
    queryKey: queryFor("restrictedKeywords"),
    queryFn: ({ signal }) => moderationRuleService.list({ kind: "restrictedKeywords", signal }),
    enabled: wf05ApiEnabled,
  });
  const themeQuery = useQuery({
    queryKey: queryFor("prohibitedThemes"),
    queryFn: ({ signal }) => moderationRuleService.list({ kind: "prohibitedThemes", signal }),
    enabled: wf05ApiEnabled,
  });
  const queries = [keywordQuery, themeQuery];
  const decision = useMutation({
    mutationFn: reviewProposal,
    onSuccess: async (saved, variables) => {
      setLockedId(null);
      setNotice(`Đã cập nhật đề xuất thành “${moderationRuleStatuses[moderationStatus(saved)]}”.`);
      await client.invalidateQueries({ queryKey: queryFor(variables.kind) });
      await client.invalidateQueries({ queryKey: ["admin-restricted-keywords", user.id] });
      await client.invalidateQueries({ queryKey: ["admin-moderation-catalog", user.id] });
    },
    onError: async (error, variables) => {
      if (isUnknownOutcome(error)) setLockedId(variables.id);
      await client.invalidateQueries({ queryKey: queryFor(variables.kind) });
    },
  });

  const proposals = ruleKinds.flatMap(({ kind, label, field, path }, index) => (queries[index].data || [])
    .filter((item) => moderationStatus(item) === 1)
    .map((item) => ({ kind, label, field, path, item })));
  const filtered = kindFilter === "all" ? proposals : proposals.filter((entry) => entry.kind === kindFilter);
  const isLoading = queries.some((query) => query.isLoading);
  const errors = queries.filter((query) => query.isError).map((query) => query.error.message);
  const unknownOwners = filtered.filter(({ item }) => !moderationOwnerId(item)).length;

  async function reconcile() {
    const results = await Promise.all(queries.map((query) => query.refetch()));
    if (results.every((result) => result.isSuccess)) {
      setLockedId(null);
      setNotice("Đã đối chiếu lại hàng chờ từ máy chủ.");
    }
  }

  if (!wf05ApiEnabled) return <main className="workspace-dashboard wf05-page"><header className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / KIỂM DUYỆT</p><h1>Hàng chờ đề xuất</h1><p>Duyệt nội dung do Content Manager gửi và quản lý trạng thái ở các danh mục.</p></div><Prohibit size={42} className="admin-heading-icon" aria-hidden="true" /></header><section className="wf05-reconcile"><strong>WF-05 đang khóa</strong><p>Backend chưa xác nhận authorization, owner scope và bộ lọc Active cho keyword consumer. Hàng chờ sẽ mở sau khi các điều kiện này được xác minh trên môi trường thử nghiệm.</p><div className="wf05-rule-actions"><Link className="workspace-button workspace-button-quiet" to="/admin/restrictions">Danh mục từ khóa</Link><Link className="workspace-button workspace-button-quiet" to="/admin/prohibited-themes">Danh mục chủ đề cấm</Link></div></section></main>;
  if (isLoading) return <LoadingState label="Đang tải hàng chờ duyệt" />;
  if (errors.length && queries.every((query) => query.isError)) return <ErrorState title="Không thể tải hàng chờ duyệt" message={errors.join(" · ")} onRetry={() => Promise.all(queries.map((query) => query.refetch()))} />;

  return (
    <main className="workspace-dashboard wf05-page">
      <header className="workspace-page-heading"><div><p className="workspace-eyebrow">ADMIN / KIỂM DUYỆT</p><h1>Hàng chờ đề xuất</h1><p>Duyệt nội dung do Content Manager gửi và quản lý trạng thái ở các danh mục.</p></div><Prohibit size={42} className="admin-heading-icon" aria-hidden="true" /></header>
      <nav className="wf05-tabs" aria-label="Lọc loại đề xuất">
        <button type="button" aria-pressed={kindFilter === "all"} onClick={() => setKindFilter("all")}>Tất cả <span>{proposals.length}</span></button>
        {ruleKinds.map(({ kind, label }) => <button key={kind} type="button" aria-pressed={kindFilter === kind} onClick={() => setKindFilter(kind)}>{label} <span>{proposals.filter((entry) => entry.kind === kind).length}</span></button>)}
      </nav>
      {errors.length > 0 && <div className="wf05-reconcile" role="alert"><strong>Một số danh mục chưa tải được</strong><p>{errors.join(" · ")}</p><button className="workspace-button workspace-button-quiet" type="button" onClick={() => Promise.all(queries.map((query) => query.refetch()))}>Thử tải lại</button></div>}
      <section className="wf05-list-panel" aria-label="Đề xuất chờ duyệt">
        <div className="wf05-section-heading"><div><p className="workspace-eyebrow">TRẠNG THÁI PENDING</p><h2>{filtered.length} đề xuất chờ xử lý</h2></div><button className="workspace-button workspace-button-quiet" type="button" onClick={reconcile} disabled={queries.some((query) => query.isFetching)}><ArrowClockwise size={16} aria-hidden="true" /> Làm mới</button></div>
        {unknownOwners > 0 && <p className="wf05-owner-note">Một số bản ghi không có mã người tạo hợp lệ. Có thể xử lý nội dung, nhưng máy chủ cần được xác minh để đảm bảo đúng quyền và lưu lịch sử người duyệt.</p>}
        {filtered.length ? <div className="wf05-rule-list">{filtered.map(({ kind, label, field, path, item }) => <article className="wf05-rule-row" key={`${kind}:${item.id}`}>
          <div className="wf05-rule-copy"><div className="wf05-rule-meta"><StatusBadge value="pending" label="Chờ duyệt" tone="gold" /><span>{label} · {createdAt(item)}</span></div><h3>{item[field] || "Chưa có nội dung"}</h3><p>{item.description || "Không có mô tả."}</p><small>Cách khớp: {Number(item.matchType) === 1 ? "Có chứa" : Number(item.matchType) === 0 ? "Khớp chính xác" : Number(item.matchType) === 2 ? "Biểu thức chính quy" : "Chưa xác định"} · Mức độ: {item.severityLevel ?? "—"} · Hành động: {Number(item.action) === 0 ? "Từ chối" : Number(item.action) === 1 ? "Chuyển kiểm duyệt" : Number(item.action) === 2 ? "Che nội dung" : "Chưa xác định"}</small></div>
          <div className="wf05-rule-actions"><Link className="workspace-button workspace-button-quiet" to={path}>Mở danh mục</Link><button className="workspace-button workspace-button-quiet" type="button" disabled={decision.isPending || lockedId === item.id} onClick={() => { setNotice(""); decision.mutate({ kind, id: item.id, targetStatus: 0 }); }}><X size={16} aria-hidden="true" /> Trả về nháp</button><button className="workspace-button" type="button" disabled={decision.isPending || lockedId === item.id} onClick={() => { setNotice(""); decision.mutate({ kind, id: item.id, targetStatus: 2 }); }}><Check size={16} aria-hidden="true" /> Duyệt</button></div>
        </article>)}</div> : <div className="wf05-empty"><Clock size={25} aria-hidden="true" /><h3>Hàng chờ đang trống</h3><p>Đề xuất mới của Content Manager sẽ xuất hiện tại đây.</p></div>}
      </section>
      {notice && <p className="workspace-inline-success" role="status">{notice}</p>}
      {decision.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={17} aria-hidden="true" /> {decision.error.message}</p>}
      {lockedId && <div className="wf05-reconcile" role="alert"><strong>Kết quả quyết định chưa rõ</strong><p>Không gửi lại quyết định này cho tới khi trạng thái được đối chiếu với máy chủ.</p><button className="workspace-button workspace-button-quiet" type="button" onClick={reconcile}><ArrowClockwise size={16} aria-hidden="true" /> Đối chiếu bằng GET</button></div>}
      <p className="wf05-note">Duyệt đổi trạng thái đề xuất sang Active theo API hiện có. Việc đó chưa xác nhận quy tắc đã được áp dụng trong mọi luồng tạo nội dung; cần nghiệm thu consumer Backend riêng.</p>
    </main>
  );
}
