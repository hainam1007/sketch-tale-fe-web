import { useEffect, useState } from "react";
import { Check, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { queryKeys } from "../../../lib/api/queryKeys";
import { parentApprovalService } from "../services/parentApprovalService";

const filters = [
  ["pending", "Chờ duyệt"],
  ["approved", "Đã duyệt"],
  ["rejected", "Đã từ chối"],
];
const statusLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối" };
const roleTypes = ["Nhân vật chính", "Bạn đồng hành", "Vai hỗ trợ", "Vai khác"];
const pageSize = 20;

export default function ParentApprovalsLive({ child, userId }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const status = filters.some(([value]) => value === requestedStatus) ? requestedStatus : "pending";
  const selectedId = searchParams.get("approvalId");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...queryKeys.childApprovals(userId, child.id, { status, page }), "real"],
    queryFn: ({ signal }) => parentApprovalService.list({ childId: child.id, status, page, pageSize, signal }),
  });
  const mutation = useMutation({
    mutationFn: ({ mappingId, nextStatus }) => parentApprovalService.updateStatus({ mappingId, status: nextStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-approvals", userId, child.id] }),
    onError: (error) => {
      if ([400, 409].includes(error?.status)) {
        void queryClient.invalidateQueries({ queryKey: ["child-approvals", userId, child.id] });
      }
    },
  });
  const items = query.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) || items[0] || null;
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      const next = new URLSearchParams(searchParams);
      next.set("approvalId", selected.id);
      setSearchParams(next, { replace: true });
    }
  }, [selected, selectedId, searchParams, setSearchParams]);

  if (query.isPending) return <LoadingState label="Đang tải yêu cầu phê duyệt" />;
  if (query.isError) return <ErrorState title="Chưa tải được yêu cầu phê duyệt" message={query.error.message} onRetry={() => query.refetch()} />;

  function changeStatus(value) {
    const next = new URLSearchParams(searchParams);
    next.set("status", value);
    next.delete("approvalId");
    setSearchParams(next);
    setPage(1);
    mutation.reset();
  }

  function selectApproval(id) {
    const next = new URLSearchParams(searchParams);
    next.set("approvalId", id);
    setSearchParams(next);
  }

  const childName = child.nickName || child.displayName || "bé";
  return (
    <div className="parent-approval-page">
      <header className="parent-feature-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / PHÊ DUYỆT / {childName.toUpperCase()}</p>
          <h2>Yêu cầu dùng nhân vật trong truyện</h2>
          <p>Xem tranh và nhân vật trước khi quyết định cho phép bé dùng vai này.</p>
        </div>
        <span className="parent-feature-icon"><ShieldCheck size={27} aria-hidden="true" /></span>
      </header>
      <div className="approval-filter-row">
        <div className="approval-status-tabs" aria-label="Trạng thái phê duyệt">
          {filters.map(([value, label]) => (
            <button key={value} type="button" className={status === value ? "active" : ""} aria-pressed={status === value} onClick={() => changeStatus(value)}>
              {label}
            </button>
          ))}
        </div>
        <span className="approval-count">{total} yêu cầu</span>
      </div>
      {mutation.isError && <p className="approval-live-error" role="alert"><WarningCircle size={17} aria-hidden="true" /> {mutation.error.message}</p>}

      {items.length ? (
        <div className="approval-layout">
          <div className="approval-list" aria-label="Danh sách yêu cầu phê duyệt">
            {items.map((item) => {
              const itemStatus = normalizeStatus(item.parentApprovalStatus);
              const thumbnail = item.characterImageUrl || item.originalDrawingImageUrl;
              return (
                <button className={"approval-list-item " + (selected?.id === item.id ? "active" : "")} type="button" key={item.id} onClick={() => selectApproval(item.id)}>
                  {thumbnail ? <img src={thumbnail} alt="" width="52" height="52" /> : <span className="approval-list-placeholder" aria-hidden="true">{item.characterName?.slice(0, 1) || "?"}</span>}
                  <span><strong>{item.characterName || "Nhân vật chưa đặt tên"}</strong><small>{item.storyTitle || "Truyện"} · {item.roleName || roleLabel(item.storyRoleType)}</small></span>
                  <StatusBadge value={statusLabels[itemStatus] || "Chưa rõ"} tone={itemStatus === "approved" ? "success" : itemStatus === "rejected" ? "danger" : "gold"} />
                </button>
              );
            })}
          </div>
          {selected && (
            <ApprovalDetail
              key={`${selected.id}:${selected.characterImageUrl || ""}`}
              item={selected}
              busy={mutation.isPending}
              mutationError={mutation.error}
              onDecision={(nextStatus) => mutation.mutate({ mappingId: selected.id, nextStatus })}
            />
          )}
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title={status === "pending" ? "Không có yêu cầu chờ duyệt" : "Chưa có lịch sử ở trạng thái này"} message={"Hồ sơ " + childName + " không có yêu cầu nào trong nhóm này."} />
      )}
      {pageCount > 1 && (
        <div className="approval-live-pagination" aria-label="Trang yêu cầu phê duyệt">
          <button className="workspace-button workspace-button-quiet" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button>
          <span>Trang {page} / {pageCount}</span>
          <button className="workspace-button workspace-button-quiet" type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}

function ApprovalDetail({ item, busy, mutationError, onDecision }) {
  const [imageState, setImageState] = useState(item.characterImageUrl ? "loading" : "missing");
  const [imageAttempt, setImageAttempt] = useState(0);
  const itemStatus = normalizeStatus(item.parentApprovalStatus);
  const isPending = itemStatus === "pending";
  const date = formatDate(item.createdAt);

  return (
    <article className="approval-detail-card">
      <div className="approval-detail-heading">
        <div><span className="workspace-eyebrow">NHÂN VẬT / {roleLabel(item.storyRoleType).toUpperCase()}</span><h3>{item.characterName || "Nhân vật chưa đặt tên"}</h3><p>{item.storyTitle || "Truyện"} · {item.roleName || roleLabel(item.storyRoleType)} · Gửi {date}</p></div>
        <StatusBadge value={statusLabels[itemStatus] || "Chưa rõ"} tone={itemStatus === "approved" ? "success" : itemStatus === "rejected" ? "danger" : "gold"} />
      </div>
      <div className="approval-image-compare" style={{ gridTemplateColumns: item.originalDrawingImageUrl ? undefined : "1fr" }}>
        {item.originalDrawingImageUrl && <figure><img src={item.originalDrawingImageUrl} alt={"Tranh gốc của " + item.characterName} /><figcaption>Tranh bé gửi</figcaption></figure>}
        {item.originalDrawingImageUrl && <span aria-hidden="true">→</span>}
        <figure>
          {item.characterImageUrl ? (
            <img key={imageAttempt} src={item.characterImageUrl} alt={"Nhân vật " + item.characterName} onLoad={() => setImageState("ready")} onError={() => setImageState("failed")} />
          ) : (
            <div className="approval-image-placeholder" aria-hidden="true">Chưa có ảnh nhân vật</div>
          )}
          <figcaption>Nhân vật dùng trong truyện</figcaption>
        </figure>
      </div>
      {isPending && imageState !== "ready" && (
        <p className="approval-image-warning" role="status">
          {imageState === "failed" ? "Không tải được ảnh nhân vật; hãy thử lại trước khi quyết định." : "Đang tải ảnh để phụ huynh xem trước khi quyết định."}
          {imageState === "failed" && <button type="button" className="approval-image-retry" onClick={() => { setImageState("loading"); setImageAttempt((attempt) => attempt + 1); }}>Tải lại ảnh</button>}
        </p>
      )}
      {mutationError && <p className="approval-live-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {mutationError.message}</p>}
      {isPending && (
        <div className="approval-actions">
          <button className="workspace-button workspace-button-quiet" type="button" disabled={busy || imageState !== "ready"} onClick={() => onDecision("rejected")}><X size={17} aria-hidden="true" /> Từ chối yêu cầu</button>
          <button className="workspace-button" type="button" disabled={busy || imageState !== "ready"} onClick={() => onDecision("approved")}><Check size={17} aria-hidden="true" /> {busy ? "Đang lưu…" : "Cho phép sử dụng"}</button>
        </div>
      )}
      {itemStatus === "approved" && <p className="workspace-inline-success" role="status"><Check size={17} aria-hidden="true" /> Đã cho phép dùng nhân vật này trong truyện.</p>}
      {itemStatus === "rejected" && <p className="approval-rejected-note" role="status"><X size={17} aria-hidden="true" /> Yêu cầu này đã bị từ chối.</p>}
    </article>
  );
}

function normalizeStatus(value) {
  if (typeof value === "number") return ["not_required", "pending", "approved", "rejected"][value] || "unknown";
  const normalized = String(value ?? "").replace(/[_\s-]/g, "").toLowerCase();
  return normalized === "notrequired" ? "not_required" : normalized || "unknown";
}

function roleLabel(value) {
  if (typeof value === "number") return roleTypes[value] || "Vai trong truyện";
  const normalized = String(value ?? "").toLowerCase();
  return ({ maincharacter: roleTypes[0], companion: roleTypes[1], supporting: roleTypes[2], other: roleTypes[3] })[normalized] || "Vai trong truyện";
}

function formatDate(value) {
  if (!value) return "không rõ ngày";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "không rõ ngày" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}
