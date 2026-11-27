import { useMemo, useState } from "react";
import { ArrowClockwise, Check, Clock, Plus, Prohibit, WarningCircle, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { moderationRuleService, isModerationOwner, moderationRuleStatuses, moderationStatus, wf05ApiEnabled } from "../services/moderationRuleService";
import "../../admin/admin.css";

const kinds = {
  restrictedKeywords: { label: "Từ khóa hạn chế", valueLabel: "Từ khóa", placeholder: "Nhập từ hoặc cụm từ cần hạn chế" },
  prohibitedThemes: { label: "Chủ đề cấm", valueLabel: "Tên chủ đề", placeholder: "Nhập tên chủ đề cần đề xuất" },
};
const blankForm = { value: "", description: "", severityLevel: "1" };
const activeStatuses = new Set([0, 1, 2]);

function normalizeValue(value) {
  return String(value || "").normalize("NFC").trim().toLocaleLowerCase("vi");
}

function valueOf(kind, item) {
  return kind === "restrictedKeywords" ? item.keyword : item.name;
}

function createdAt(item) {
  const value = item.createdAt;
  if (!value || Number.isNaN(new Date(value).getTime())) return "Ngày tạo chưa được cung cấp";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function acceptedUnknown(error) {
  return Boolean(error?.mutationAccepted || error?.code === "NETWORK_ERROR" || Number(error?.status) >= 500);
}

function payloadFor(kind, form, status) {
  return {
    ...(kind === "restrictedKeywords" ? { keyword: form.value.trim() } : { name: form.value.trim() }),
    description: form.description.trim() || null,
    matchType: 1,
    severityLevel: Number(form.severityLevel),
    action: 0,
    status,
  };
}

function matchesPayload(kind, item, payload) {
  return valueOf(kind, item) === payload[kind === "restrictedKeywords" ? "keyword" : "name"]
    && (item.description || null) === payload.description
    && Number(item.matchType) === payload.matchType
    && Number(item.severityLevel) === payload.severityLevel
    && Number(item.action) === payload.action
    && moderationStatus(item) === payload.status;
}

async function saveAndVerify({ kind, id, payload, userId }) {
  let accepted = false;
  try {
    if (id) {
      const latest = await moderationRuleService.get({ kind, id });
      if (!isModerationOwner(latest, userId)) throw new Error("Không xác minh được người tạo bản ghi. Thao tác đã bị khóa.");
      if (moderationStatus(latest) !== 0) throw new Error("Bản nháp đã thay đổi trạng thái. Tải lại danh sách trước khi thao tác.");
      await moderationRuleService.update({ kind, id, payload: { ...latest, ...payload } });
      accepted = true;
    } else {
      const created = await moderationRuleService.create({ kind, payload });
      accepted = true;
      if (!created?.id) {
        const error = new Error("Máy chủ đã nhận yêu cầu nhưng không trả về mã bản ghi. Hãy đối chiếu danh sách trước khi gửi lại.");
        error.mutationAccepted = true;
        throw error;
      }
      id = created.id;
    }

    const saved = await moderationRuleService.get({ kind, id });
    if (!isModerationOwner(saved, userId)) {
      const error = new Error("Yêu cầu đã được gửi nhưng máy chủ chưa xác nhận đúng người tạo. Không gửi lại; hãy đối chiếu với Admin.");
      error.mutationAccepted = true;
      throw error;
    }
    if (!matchesPayload(kind, saved, payload)) {
      const error = new Error("Máy chủ đã nhận thay đổi nhưng dữ liệu đọc lại chưa khớp. Không gửi lại; hãy làm mới để đối chiếu.");
      error.mutationAccepted = true;
      throw error;
    }
    return saved;
  } catch (error) {
    if (accepted) error.mutationAccepted = true;
    throw error;
  }
}

export default function ContentModerationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState("restrictedKeywords");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [unresolved, setUnresolved] = useState(false);
  const [notice, setNotice] = useState("");
  const queryKey = ["wf05-moderation-rules", user.id, kind];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => moderationRuleService.list({ kind, signal }),
    enabled: wf05ApiEnabled,
  });
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) => saveAndVerify({ kind, id, payload, userId: user.id }),
    onSuccess: async (_saved, variables) => {
      await queryClient.invalidateQueries({ queryKey });
      setEditor(null);
      setForm(blankForm);
      setUnresolved(false);
      setNotice(variables.payload.status === 1 ? "Đã gửi đề xuất vào hàng chờ Admin duyệt." : "Đã lưu bản nháp.");
    },
    onError: (error) => {
      if (acceptedUnknown(error)) setUnresolved(true);
    },
  });

  const allItems = query.data || [];
  const ownItems = useMemo(() => allItems.filter((item) => isModerationOwner(item, user.id)), [allItems, user.id]);
  const otherItems = allItems.length - ownItems.length;
  const duplicate = useMemo(() => {
    const target = normalizeValue(form.value);
    if (!target) return null;
    return allItems.find((item) => item.id !== editor?.id && activeStatuses.has(moderationStatus(item)) && normalizeValue(valueOf(kind, item)) === target) || null;
  }, [allItems, editor?.id, form.value, kind]);

  function openEditor(item = null) {
    setNotice("");
    setFormError("");
    setForm(item ? {
      value: valueOf(kind, item) || "",
      description: item.description || "",
      severityLevel: String(item.severityLevel ?? 1),
    } : blankForm);
    setEditor(item || { id: null });
    saveMutation.reset();
  }

  function submit(status) {
    if (!editor || saveMutation.isPending || unresolved) return;
    if (!form.value.trim()) {
      setFormError(`Nhập ${kinds[kind].valueLabel.toLocaleLowerCase("vi")} trước khi tiếp tục.`);
      return;
    }
    if (!Number.isInteger(Number(form.severityLevel)) || Number(form.severityLevel) < 0 || Number(form.severityLevel) > 3) {
      setFormError("Chọn mức độ hợp lệ.");
      return;
    }
    if (duplicate) {
      setFormError(`Nội dung này đã có trong danh sách với trạng thái “${moderationRuleStatuses[moderationStatus(duplicate)]}”.`);
      return;
    }
    setFormError("");
    setNotice("");
    saveMutation.mutate({ id: editor.id || null, payload: payloadFor(kind, form, status) });
  }

  function sendDraft(item) {
    const itemForm = {
      value: valueOf(kind, item) || "",
      description: item.description || "",
      severityLevel: String(item.severityLevel ?? 1),
    };
    const duplicateItem = allItems.find((candidate) => candidate.id !== item.id
      && activeStatuses.has(moderationStatus(candidate))
      && normalizeValue(valueOf(kind, candidate)) === normalizeValue(itemForm.value));
    if (duplicateItem) {
      setNotice(`Chưa gửi: nội dung này đã tồn tại với trạng thái “${moderationRuleStatuses[moderationStatus(duplicateItem)]}”.`);
      return;
    }
    setNotice("");
    saveMutation.mutate({ id: item.id, payload: payloadFor(kind, itemForm, 1) });
  }

  async function reconcile() {
    const result = await query.refetch();
    if (result.isSuccess) {
      setUnresolved(false);
      setNotice("Đã tải lại danh sách từ máy chủ. Kiểm tra mục vừa gửi trước khi tạo đề xuất khác.");
    }
  }

  if (!wf05ApiEnabled) return <main className="workspace-dashboard wf05-page"><header className="workspace-page-heading"><div><p className="workspace-eyebrow">CONTENT MANAGER / KIỂM DUYỆT</p><h1>Đề xuất kiểm duyệt</h1><p>Tạo quy tắc ở trạng thái nháp hoặc gửi Admin duyệt.</p></div><Prohibit size={42} className="admin-heading-icon" aria-hidden="true" /></header><section className="wf05-reconcile"><strong>WF-05 đang khóa</strong><p>Backend hiện chưa xác nhận owner scope và áp dụng keyword theo trạng thái Active. Bật API chỉ sau khi các điều kiện này được kiểm tra trên môi trường thử nghiệm.</p></section></main>;
  if (query.isLoading) return <LoadingState label="Đang tải đề xuất kiểm duyệt" />;
  if (query.isError && !query.data) return <ErrorState title="Không thể tải đề xuất kiểm duyệt" message={query.error.message} onRetry={() => query.refetch()} />;

  return (
    <main className="workspace-dashboard wf05-page">
      <header className="workspace-page-heading">
        <div><p className="workspace-eyebrow">CONTENT MANAGER / KIỂM DUYỆT</p><h1>Đề xuất kiểm duyệt</h1><p>Tạo quy tắc ở trạng thái nháp hoặc gửi Admin duyệt.</p></div>
        <Prohibit size={42} className="admin-heading-icon" aria-hidden="true" />
      </header>

      <section className="wf05-note" aria-label="Phạm vi quy tắc">
        <strong>Phạm vi hiện được xác minh</strong>
        <p>Đề xuất dùng so khớp “Có chứa” và hành động “Từ chối”. Chủ đề cấm được lưu để Admin duyệt; nơi áp dụng ở Backend chưa được xác minh nên giao diện không khẳng định quy tắc đã có hiệu lực kiểm duyệt.</p>
      </section>

      <nav className="wf05-tabs" aria-label="Loại đề xuất">
        {Object.entries(kinds).map(([key, value]) => <button key={key} type="button" aria-pressed={kind === key} disabled={unresolved || saveMutation.isPending} onClick={() => { setKind(key); setEditor(null); setNotice(""); saveMutation.reset(); }}>{value.label}</button>)}
      </nav>

      <section className="wf05-list-panel" aria-labelledby="wf05-list-title">
        <div className="wf05-section-heading"><div><p className="workspace-eyebrow">CÁ NHÂN</p><h2 id="wf05-list-title">Đề xuất của tôi</h2></div><button className="workspace-button" type="button" onClick={() => openEditor()} disabled={unresolved || saveMutation.isPending}><Plus size={17} aria-hidden="true" /> Tạo đề xuất</button></div>
        {otherItems > 0 && <p className="wf05-owner-note">{otherItems} mục không thuộc tài khoản hiện tại hoặc không xác định được người tạo nên đã ẩn; không thể chỉnh sửa các mục đó từ màn hình này.</p>}
        {query.isFetching && <p className="wf05-muted" role="status">Đang đồng bộ với máy chủ…</p>}
        {ownItems.length ? <div className="wf05-rule-list">{ownItems.map((item) => {
          const status = moderationStatus(item);
          const editable = status === 0 && !unresolved;
          return <article className="wf05-rule-row" key={item.id}>
            <div className="wf05-rule-copy"><div className="wf05-rule-meta"><StatusBadge value={String(status ?? "unknown")} label={status == null ? "Chưa xác định" : moderationRuleStatuses[status]} tone={status === 2 ? "success" : status === 1 ? "gold" : "neutral"} /><span>{createdAt(item)}</span></div><h3>{valueOf(kind, item) || "Chưa có nội dung"}</h3><p>{item.description || "Không có mô tả."}</p>{status === 3 && <small>Quy tắc đã ngưng áp dụng.</small>}</div>
            <div className="wf05-rule-actions">{editable ? <><button className="workspace-button workspace-button-quiet" type="button" onClick={() => openEditor(item)} disabled={saveMutation.isPending}>Sửa nháp</button><button className="workspace-button" type="button" onClick={() => sendDraft(item)} disabled={saveMutation.isPending || unresolved}>Gửi duyệt</button></> : status === 1 ? <span className="wf05-muted"><Clock size={15} aria-hidden="true" /> Đang chờ Admin</span> : null}</div>
          </article>;
        })}</div> : <div className="wf05-empty"><Prohibit size={25} aria-hidden="true" /><h3>Chưa có đề xuất của bạn</h3><p>Tạo bản nháp hoặc gửi quy tắc mới vào hàng chờ Admin.</p></div>}
      </section>

      {notice && <p className="workspace-inline-success" role="status">{notice}</p>}
      {saveMutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={17} aria-hidden="true" /> {saveMutation.error.message}</p>}
      {unresolved && <div className="wf05-reconcile" role="alert"><strong>Chưa xác định được kết quả gửi</strong><p>Không gửi lại thao tác này. Tải lại danh sách để đối chiếu với dữ liệu máy chủ trước khi tiếp tục.</p><button className="workspace-button workspace-button-quiet" type="button" onClick={reconcile} disabled={query.isFetching}><ArrowClockwise size={16} aria-hidden="true" /> Đối chiếu bằng GET</button></div>}

      {editor && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel" role="dialog" aria-modal="true" aria-labelledby="wf05-editor-title"><div className="admin-dialog-heading"><div><p className="workspace-eyebrow">{kinds[kind].label.toLocaleUpperCase("vi")}</p><h2 id="wf05-editor-title">{editor.id ? "Sửa bản nháp" : "Tạo đề xuất"}</h2></div><button className="icon-button" type="button" aria-label="Đóng biểu mẫu" onClick={() => setEditor(null)} disabled={saveMutation.isPending || unresolved}><X size={18} aria-hidden="true" /></button></div>
        <p className="wf05-muted">Chỉ bản nháp do bạn tạo mới được chỉnh sửa. Gửi duyệt sẽ khóa nội dung cho tới khi Admin xử lý.</p>
        <div className="admin-editor-fields"><label className="admin-catalog-field"><span>{kinds[kind].valueLabel} <b>*</b></span><input autoFocus maxLength={200} value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder={kinds[kind].placeholder} disabled={saveMutation.isPending || unresolved} /></label><label className="admin-catalog-field"><span>Mô tả</span><textarea maxLength={1000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} disabled={saveMutation.isPending || unresolved} /></label><label className="admin-catalog-field"><span>Mức độ</span><select value={form.severityLevel} onChange={(event) => setForm((current) => ({ ...current, severityLevel: event.target.value }))} disabled={saveMutation.isPending || unresolved}><option value="0">Thấp</option><option value="1">Trung bình</option><option value="2">Cao</option><option value="3">Chặn ngay</option></select></label><p className="wf05-fixed-rule">Cách khớp: Có chứa · Hành động: Từ chối</p></div>
        {duplicate && <p className="admin-field-error" role="alert">Nội dung này đã tồn tại trong danh sách. Kiểm tra mục “{valueOf(kind, duplicate)}” trước khi tạo.</p>}{formError && <p className="admin-field-error" role="alert">{formError}</p>}{saveMutation.isError && <p className="admin-mutation-error" role="alert">{saveMutation.error.message}</p>}
        <div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setEditor(null)} disabled={saveMutation.isPending || unresolved}>Đóng</button><button className="workspace-button workspace-button-quiet" type="button" onClick={() => submit(0)} disabled={saveMutation.isPending || unresolved || Boolean(duplicate)}>{saveMutation.isPending ? "Đang lưu…" : "Lưu nháp"}</button><button className="workspace-button" type="button" onClick={() => submit(1)} disabled={saveMutation.isPending || unresolved || Boolean(duplicate)}><Check size={16} aria-hidden="true" /> {saveMutation.isPending ? "Đang gửi…" : "Gửi duyệt"}</button></div>
      </section></div>}
    </main>
  );
}
