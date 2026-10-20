import { useEffect, useMemo, useState } from "react";
import { ArrowClockwise, Check, Coins, GraduationCap, MagnifyingGlass, Package, Plus, Trash, X } from "@phosphor-icons/react";
import { useBlocker } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminCatalogService } from "../services/adminCatalogService";
import "../admin.css";

const config = {
  plans: {
    path: "/admin/subscription-plans", title: "Gói sử dụng", eyebrow: "DANH MỤC · GÓI", description: "Quản lý giới hạn và quyền lợi được cấu hình cho từng gói.", icon: Package,
    fields: [
      { key: "name", label: "Tên gói", type: "text", required: true },
      { key: "code", label: "Mã gói", type: "text", required: true, help: "Mã định danh dùng trong hệ thống." },
      { key: "price", label: "Giá (đơn vị chưa được API xác nhận)", type: "number", min: 0, step: "any", required: true },
      { key: "childProfileLimit", label: "Số hồ sơ trẻ tối đa", type: "number", min: 0, step: 1, required: true },
      { key: "monthlyCreditLimit", label: "Credit mỗi tháng", type: "number", min: 0, step: 1, required: true },
      { key: "durationDays", label: "Thời hạn (ngày)", type: "number", min: 0, step: 1, nullable: true, help: "Để trống sẽ gửi null." },
      { key: "freeTrialDays", label: "Dùng thử (ngày)", type: "number", min: 0, step: 1, nullable: true },
      { key: "accessFullStories", label: "Truy cập toàn bộ truyện", type: "checkbox" },
      { key: "canExportStory", label: "Được xuất truyện", type: "checkbox" },
      { key: "isActive", label: "Đang cung cấp", type: "checkbox" },
    ],
    columns: ["name", "code", "price", "monthlyCreditLimit", "childProfileLimit", "isActive"],
  },
  credits: {
    path: "/admin/credit-costs", title: "Chi phí credit", eyebrow: "DANH MỤC · CREDIT", description: "Cấu hình chi phí credit theo tính năng; trang này không quản lý số dư tài khoản.", icon: Coins,
    fields: [
      { key: "featureKey", label: "Mã tính năng", type: "text", required: true },
      { key: "featureNameVi", label: "Tên tiếng Việt", type: "text", required: true },
      { key: "featureNameEn", label: "Tên tiếng Anh", type: "text", required: true },
      { key: "cost", label: "Credit mỗi lượt", type: "number", min: 0, step: 1, required: true },
      { key: "isActive", label: "Đang áp dụng", type: "checkbox" },
    ],
    columns: ["featureKey", "featureNameVi", "cost", "isActive"],
  },
  themes: {
    path: "/admin/education-themes", title: "Chủ đề giáo dục", eyebrow: "DANH MỤC · NỘI DUNG", description: "Danh mục chủ đề được Content Manager dùng khi biên soạn truyện.", icon: GraduationCap,
    fields: [
      { key: "name", label: "Tên chủ đề", type: "text", required: true },
      { key: "description", label: "Mô tả", type: "textarea", nullable: true },
      { key: "status", label: "Trạng thái", type: "status", help: "CommonStatus: 0 nháp, 1 chờ xử lý, 2 đang hoạt động, 3 đã tắt, 4 lưu trữ." },
    ],
    columns: ["name", "description", "status"],
  },
};

const defaults = {
  plans: { name: "", code: "", price: "", childProfileLimit: "", monthlyCreditLimit: "", durationDays: "", freeTrialDays: "", accessFullStories: false, canExportStory: false, isActive: true },
  credits: { featureKey: "", featureNameVi: "", featureNameEn: "", cost: "", isActive: true },
  themes: { name: "", description: "", status: "2" },
};

const labels = {
  name: "Tên", code: "Mã gói", price: "Giá trị", childProfileLimit: "Hồ sơ trẻ", monthlyCreditLimit: "Credit/tháng", durationDays: "Thời hạn", freeTrialDays: "Dùng thử", accessFullStories: "Truyện đầy đủ", canExportStory: "Xuất truyện", isActive: "Trạng thái", featureKey: "Mã tính năng", featureNameVi: "Tên tiếng Việt", featureNameEn: "Tên tiếng Anh", cost: "Credit/lượt", description: "Mô tả", status: "Trạng thái",
};

export default function AdminCatalogPage({ kind }) {
  const page = config[kind];
  const Icon = page.icon;
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ["admin-catalog", user.id, kind];
  const query = useQuery({ queryKey, queryFn: ({ signal }) => adminCatalogService.list({ kind, signal }), staleTime: 20_000 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) => id ? adminCatalogService.update({ kind, id, payload }) : adminCatalogService.create({ kind, payload }),
    onSuccess: async (_result, variables) => {
      setEditor(null);
      setPendingSave(null);
      await client.invalidateQueries({ queryKey });
      const refreshed = client.getQueryState(queryKey);
      setNotice(refreshed?.status === "error" ? "Server đã phản hồi thao tác, nhưng chưa tải lại được danh sách. Dữ liệu cũ vẫn được giữ để đối chiếu." : variables.id ? "Server đã cập nhật mục và danh sách đã được đồng bộ." : "Server đã tạo mục và danh sách đã được đồng bộ.");
      if (kind === "themes") await client.invalidateQueries({ queryKey: ["content-categories"] });
      if (kind === "plans") await client.invalidateQueries({ queryKey: ["public-plan-availability"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => adminCatalogService.remove({ kind, id }),
    onSuccess: async () => {
      setPendingDelete(null);
      await client.invalidateQueries({ queryKey });
      const refreshed = client.getQueryState(queryKey);
      setNotice(refreshed?.status === "error" ? "Server đã phản hồi yêu cầu xóa, nhưng chưa tải lại được danh sách để đối chiếu." : "Server đã xử lý yêu cầu xóa và danh sách đã được đồng bộ.");
      if (kind === "themes") await client.invalidateQueries({ queryKey: ["content-categories"] });
      if (kind === "plans") await client.invalidateQueries({ queryKey: ["public-plan-availability"] });
    },
  });
  const filtered = useMemo(() => (query.data || []).filter((item) => {
    const text = Object.values(item).filter((value) => typeof value === "string" || typeof value === "number").join(" ").toLocaleLowerCase("vi");
    const matchesSearch = text.includes(search.trim().toLocaleLowerCase("vi"));
    if (statusFilter === "all") return matchesSearch;
    if (kind === "themes") return matchesSearch && `raw:${String(item.status)}` === statusFilter;
    return matchesSearch && (statusFilter === "active" ? item.isActive === true : item.isActive === false);
  }), [query.data, search, statusFilter, kind]);
  const statusOptions = useMemo(() => kind === "themes"
    ? [...new Set((query.data || []).map((item) => item.status).filter((value) => value !== null && value !== undefined).map((value) => String(value)))]
    : [], [query.data, kind]);

  const dirty = Boolean(editor && JSON.stringify(editor.values) !== JSON.stringify(editor.initial));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => Boolean(editor && dirty && currentLocation.pathname !== nextLocation.pathname));
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function beginCreate() {
    const initial = { ...defaults[kind] };
    if (kind === "themes" && adminCatalogService.mode === "mock") initial.status = query.data?.find((item) => item.status !== null && item.status !== undefined)?.status ?? "Active";
    setNotice("");
    setFormErrors({});
    setConfirmDiscard(false);
    setEditor({ id: null, values: initial, initial: { ...initial } });
    saveMutation.reset();
  }
  function beginEdit(item) {
    const values = Object.fromEntries(page.fields.map(({ key }) => {
      const value = item[key];
      return [key, typeof value === "boolean" ? value : value === null || value === undefined ? "" : String(value)];
    }));
    setNotice("");
    setFormErrors({});
    setConfirmDiscard(false);
    setEditor({ id: item.id, values, initial: { ...values }, item });
    saveMutation.reset();
  }

  function submit(event) {
    event.preventDefault();
    if (!editor) return;
    const errors = {};
    const payload = {};
    for (const field of page.fields) {
      const value = editor.values[field.key];
      if (field.type === "checkbox") { payload[field.key] = Boolean(value); continue; }
      if ((value === "" || value === null || value === undefined) && field.nullable) { payload[field.key] = null; continue; }
      if ((value === "" || value === null || value === undefined) && field.required) { errors[field.key] = "Trường này không được để trống."; continue; }
      if (value === "" || value === null || value === undefined) continue;
      if (field.type === "number") {
        const number = Number(value);
        if (!Number.isFinite(number) || number < Number(field.min ?? 0) || (field.step === 1 && !Number.isInteger(number))) { errors[field.key] = field.step === 1 ? "Nhập số nguyên hợp lệ." : "Nhập số không âm hợp lệ."; continue; }
        payload[field.key] = number;
      } else if (field.key === "name" || field.key === "featureNameVi" || field.key === "featureNameEn" || field.key === "featureKey" || field.key === "code") {
        payload[field.key] = String(value).trim();
        if (!payload[field.key]) errors[field.key] = "Nhập giá trị hợp lệ.";
      } else if (field.type === "status" && /^-?\d+$/.test(String(value))) payload[field.key] = Number(value);
      else payload[field.key] = value;
    }
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    saveMutation.reset();
    setPendingSave({ id: editor.id, payload, values: { ...editor.values }, initial: { ...editor.initial } });
  }

  function confirmSave() {
    if (pendingSave) saveMutation.mutate({ id: pendingSave.id, payload: pendingSave.payload });
  }

  async function reconcileUnknownSave() {
    const result = await query.refetch();
    if (result.isSuccess) {
      setPendingSave(null);
      setEditor(null);
      saveMutation.reset();
      setNotice("Danh sách đã được tải lại. Hãy đối chiếu mục trước khi gửi thao tác mới.");
    }
  }

  function requestCloseEditor() {
    if (dirty) setConfirmDiscard(true);
    else setEditor(null);
  }

  if (query.isLoading) return <LoadingState label={`Đang tải ${page.title.toLocaleLowerCase("vi")}`} />;
  if (query.isError && !query.data) return <ErrorState title={`Không thể tải ${page.title.toLocaleLowerCase("vi")}`} message={query.error.message} onRetry={() => query.refetch()} />;

  return <div className={`workspace-dashboard admin-page admin-catalog-page admin-catalog-${kind}`}>
    <header className="workspace-page-heading admin-page-heading">
      <div><p className="workspace-eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.description}</p></div>
      <button className="workspace-button" type="button" onClick={beginCreate}><Plus size={17} aria-hidden="true" /> Thêm mới</button>
    </header>
    <div className={`admin-source-note ${adminCatalogService.mode === "mock" ? "is-demo" : "is-live"}`} role="status">
      <span className="admin-source-indicator" aria-hidden="true" />
      {adminCatalogService.mode === "mock" ? "Dữ liệu minh họa — thay đổi chỉ lưu trong bản demo." : "Dữ liệu từ API SketchTale."}
      <button className="icon-button" type="button" aria-label="Làm mới danh sách" onClick={() => query.refetch()} disabled={query.isFetching}><ArrowClockwise size={16} aria-hidden="true" /></button>
    </div>
    {query.isError && query.data && <p className="admin-refresh-note" role="status">Không tải được bản mới; đang giữ dữ liệu gần nhất để đối chiếu.</p>}
    <section className="admin-catalog-toolbar" aria-label={`Tìm ${page.title.toLocaleLowerCase("vi")}`}>
      <label className="admin-search"><span className="sr-only">Tìm trong danh sách</span><MagnifyingGlass size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Tìm ${page.title.toLocaleLowerCase("vi")}`} /></label>
      {kind === "themes" ? <label className="admin-catalog-filter"><span className="sr-only">Lọc theo trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Mọi trạng thái</option>{statusOptions.map((status) => <option key={status} value={`raw:${status}`}>{formatStatus(status)}</option>)}</select></label> : <label className="admin-catalog-filter"><span className="sr-only">Lọc theo trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option></select></label>}
      <span>{filtered.length} mục</span>
    </section>
    {notice && <p className="workspace-inline-success" role="status"><Check size={16} aria-hidden="true" /> {notice}</p>}
    {query.isFetching && <p className="admin-refresh-note" role="status">Đang đồng bộ danh sách…</p>}
    {filtered.length === 0 ? <div className="workspace-state workspace-state-empty"><Icon size={30} aria-hidden="true" /><strong>{query.data?.length ? "Không có kết quả phù hợp" : `Chưa có ${page.title.toLocaleLowerCase("vi")}`}</strong><p>{query.data?.length ? "Thử từ khóa khác hoặc xóa bộ lọc." : "Tạo mục đầu tiên để bắt đầu cấu hình danh mục."}</p>{(search || statusFilter !== "all") && <button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Xóa bộ lọc</button>}</div> : <div className="admin-catalog-table-wrap"><table className="admin-catalog-table"><caption className="sr-only">{page.title}</caption><thead><tr>{page.columns.map((key) => <th key={key}>{labels[key]}</th>)}<th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td colSpan={page.columns.length + 1} className="admin-catalog-row-cell"><div className="admin-catalog-row">{page.columns.map((key, index) => <div className={`admin-catalog-cell admin-catalog-cell-${key}`} key={key} data-label={labels[key]}>{key === "isActive" ? <StatusBadge value={String(item[key])} label={item[key] ? "Đang hoạt động" : "Đã tắt"} tone={item[key] ? "success" : "neutral"} /> : key === "status" ? <StatusBadge value={String(item[key] ?? "unknown")} label={formatStatus(item[key])} tone={toneForStatus(item[key])} /> : <strong className={index === 0 ? "admin-catalog-primary" : ""}>{formatValue(key, item[key])}</strong>}</div>)}<div className="admin-catalog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => beginEdit(item)}>Chỉnh sửa</button><button className="icon-button admin-catalog-delete" type="button" aria-label={`Xóa ${item.name || item.featureNameVi || item.code || item.featureKey}`} onClick={() => { deleteMutation.reset(); setPendingDelete(item); }}><Trash size={17} aria-hidden="true" /></button></div></div></td></tr>)}</tbody></table></div>}

    {editor && <div className="admin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saveMutation.isPending) requestCloseEditor(); }}><section className="admin-editor-panel" role="dialog" aria-modal="true" aria-labelledby="admin-catalog-editor-title"><div className="admin-dialog-heading"><div><p className="workspace-eyebrow">{editor.id ? "CHỈNH SỬA DANH MỤC" : "TẠO DANH MỤC"}</p><h2 id="admin-catalog-editor-title">{editor.id ? "Cập nhật" : "Thêm mới"} {page.title.toLocaleLowerCase("vi")}</h2></div><button className="icon-button" type="button" aria-label="Đóng biểu mẫu" disabled={saveMutation.isPending} onClick={requestCloseEditor}><X size={18} aria-hidden="true" /></button></div>
      {adminCatalogService.mode === "mock" && <p className="admin-editor-demo-hint">Bạn đang chỉnh dữ liệu minh họa. Thay đổi chỉ lưu trong phiên demo này.</p>}
      <form onSubmit={submit} onChange={() => { if (saveMutation.isError) saveMutation.reset(); }} noValidate><div className="admin-editor-fields">{page.fields.map((field) => <Field key={field.key} field={field} editor={editor} setEditor={setEditor} error={formErrors[field.key] || saveMutation.error?.fieldErrors?.[field.key]} statuses={kind === "themes" ? adminCatalogService.mode === "real" ? [0, 1, 2, 3, 4] : [...new Set((query.data || []).map((item) => item.status).filter((value) => value !== null && value !== undefined).concat(editor.values.status !== "" ? [editor.values.status] : []))] : []} allowStatusEdit />)}</div>
        {kind === "plans" && <p className="admin-field-note">API hiện không khai báo đơn vị tiền tệ hay cách áp dụng thay đổi cho gói đang dùng. Xác nhận chính sách trước khi phát hành thay đổi thật.</p>}
        {kind === "credits" && <p className="admin-field-note">Chi phí được lưu theo API. Cách tính cho tác vụ đang chạy và hoàn credit cần được xác nhận ở Backend.</p>}
        {kind === "themes" && <p className="admin-field-note">Chủ đề có thể đang được truyện sử dụng. Xóa dùng API Backend và chuyển trạng thái sang Inactive; CommonStatus đã được ánh xạ theo source.</p>}
        {saveMutation.isError && <p className="admin-mutation-error" role="alert">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p className="workspace-inline-success" role="status">Đã lưu thay đổi.</p>}
        {dirty && <div className="admin-catalog-diff"><strong>Thay đổi chưa lưu</strong>{page.fields.filter(({ key }) => JSON.stringify(editor.values[key]) !== JSON.stringify(editor.initial[key])).map(({ key }) => <span key={key}>{labels[key]}: {formatValue(key, editor.initial[key])} → {formatValue(key, editor.values[key])}</span>)}</div>}
        <div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={saveMutation.isPending} onClick={requestCloseEditor}>Hủy</button><button className="workspace-button" type="submit" disabled={saveMutation.isPending || !dirty}><Check size={16} aria-hidden="true" /> Tiếp tục</button></div>
      </form></section></div>}

    {pendingSave && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-save-confirm-title"><p className="workspace-eyebrow">XÁC NHẬN THAY ĐỔI</p><h2 id="admin-save-confirm-title">{pendingSave.id ? "Lưu cập nhật?" : "Tạo mục mới?"}</h2><p>{page.title}: <strong>{pendingSave.values.name || pendingSave.values.featureNameVi || pendingSave.values.code || pendingSave.values.featureKey || "Mục mới"}</strong></p><div className="admin-catalog-diff"><strong>{pendingSave.id ? "Giá trị sẽ thay đổi" : "Giá trị sẽ được tạo"}</strong>{page.fields.filter(({ key }) => Object.hasOwn(pendingSave.payload, key) && (!pendingSave.id || JSON.stringify(pendingSave.values[key]) !== JSON.stringify(pendingSave.initial[key]))).map(({ key }) => <span key={key}>{labels[key]}: {pendingSave.id ? `${formatValue(key, pendingSave.initial[key])} → ` : ""}{formatValue(key, pendingSave.payload[key])}</span>)}</div>{kind === "plans" && <p className="admin-field-note">Giá chưa có đơn vị tiền tệ và thay đổi có thể ảnh hưởng gói hiện hữu theo chính sách Backend.</p>}{kind === "credits" && pendingSave.payload.cost === 0 && <p className="admin-field-note">Chi phí 0 có thể làm tính năng miễn phí. Xác nhận đúng chủ đích trước khi lưu.</p>}{saveMutation.isError && <p className="admin-mutation-error" role="alert">{saveMutation.error.message}</p>}{saveMutation.isError && (saveMutation.error?.code === "NETWORK_ERROR" || saveMutation.error?.status >= 500) && <><p className="admin-field-note">Kết quả chưa xác định. Không gửi lại để tránh tạo bản ghi trùng; hãy tải lại danh sách rồi đối chiếu.</p><button className="workspace-button workspace-button-quiet" type="button" disabled={query.isFetching} onClick={reconcileUnknownSave}>{query.isFetching ? "Đang tải danh sách…" : "Tải danh sách để đối chiếu"}</button></>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={saveMutation.isPending} onClick={() => setPendingSave(null)}>Quay lại chỉnh sửa</button><button className="workspace-button workspace-button-danger" type="button" disabled={saveMutation.isPending || saveMutation.error?.code === "NETWORK_ERROR" || saveMutation.error?.status >= 500} onClick={confirmSave}>{saveMutation.isPending ? "Đang lưu…" : "Xác nhận lưu"}</button></div></section></div>}

    {confirmDiscard && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-discard-title"><p className="workspace-eyebrow">THAY ĐỔI CHƯA LƯU</p><h2 id="admin-discard-title">Bỏ thay đổi?</h2><p>Nội dung đang nhập sẽ bị xóa.</p><div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => setConfirmDiscard(false)}>Tiếp tục chỉnh sửa</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => { setConfirmDiscard(false); setEditor(null); }}>Bỏ thay đổi</button></div></section></div>}

    {pendingDelete && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title"><p className="workspace-eyebrow">XÓA DANH MỤC</p><h2 id="admin-delete-title">Xóa “{pendingDelete.name || pendingDelete.featureNameVi || pendingDelete.code || pendingDelete.featureKey}”?</h2><p>Backend có thể từ chối nếu mục này đang được gói, tính năng hoặc truyện tham chiếu.</p>{deleteMutation.isError && <p className="admin-mutation-error" role="alert">{deleteMutation.error.message}</p>}<div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" disabled={deleteMutation.isPending} onClick={() => setPendingDelete(null)}>Giữ lại</button><button className="workspace-button workspace-button-danger" type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(pendingDelete.id)}>{deleteMutation.isPending ? "Đang gửi…" : "Xóa mục"}</button></div></section></div>}
    {blocker.state === "blocked" && <div className="admin-overlay" role="presentation"><section className="admin-editor-panel admin-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-leave-title"><p className="workspace-eyebrow">THAY ĐỔI CHƯA LƯU</p><h2 id="admin-leave-title">Rời trang này?</h2><p>Các thay đổi đang nhập sẽ bị mất.</p><div className="admin-dialog-actions"><button className="workspace-button workspace-button-quiet" type="button" onClick={() => blocker.reset()}>Ở lại</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => { setEditor(null); blocker.proceed(); }}>Rời trang</button></div></section></div>}
  </div>;
}

function Field({ field, editor, setEditor, error, statuses, allowStatusEdit }) {
  const value = editor.values[field.key] ?? "";
  function update(next) { setEditor((current) => ({ ...current, values: { ...current.values, [field.key]: next } })); }
  const id = `admin-catalog-${field.key}`;
  if (field.type === "checkbox") return <label className="admin-catalog-checkbox" htmlFor={id}><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} /><span>{field.label}</span></label>;
  if (field.type === "status") {
    if (!allowStatusEdit) return <label className="admin-catalog-field" htmlFor={id}><span>{field.label}</span><output id={id} className="admin-catalog-status-locked">{value === "" ? "Không gửi trạng thái chưa được xác nhận" : `Giá trị hiện tại: ${String(value)}`}</output><small>CommonStatus chưa được xác nhận.</small></label>;
    const source = statuses.length ? statuses : [0, 1, 2, 3, 4];
    return <label className="admin-catalog-field" htmlFor={id}><span>{field.label}</span><select id={id} value={String(value)} onChange={(event) => update(source.find((status) => String(status) === event.target.value))}><option value="">Chọn trạng thái</option>{source.map((status) => <option value={String(status)} key={String(status)}>{formatStatus(status)} · {String(status)}</option>)}</select><small>{field.help}</small>{error && <small className="admin-field-error">{error}</small>}</label>;
  }
  return <label className="admin-catalog-field" htmlFor={id}><span>{field.label}{field.required && <b aria-hidden="true"> *</b>}</span>{field.type === "textarea" ? <textarea id={id} rows={4} value={value} onChange={(event) => update(event.target.value)} aria-invalid={Boolean(error)} /> : <input id={id} type={field.type} min={field.min} step={field.step} required={field.required} value={value} onChange={(event) => update(event.target.value)} aria-invalid={Boolean(error)} />}{field.help && <small>{field.help}</small>}{error && <small className="admin-field-error">{error}</small>}</label>;
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "Chưa thiết lập";
  if (key === "price") return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(value));
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}
function formatStatus(value) {
  if (value === null || value === undefined || value === "") return "Chưa thiết lập";
  const normalized = String(value).toLowerCase();
  const commonStatus = { 0: "Nháp", 1: "Chờ xử lý", 2: "Đang hoạt động", 3: "Đã tắt", 4: "Lưu trữ" }[normalized];
  if (commonStatus) return commonStatus;
  if (["active", "enabled"].includes(normalized)) return "Đang hoạt động";
  if (["inactive", "disabled"].includes(normalized)) return "Đã tắt";
  return String(value);
}
function toneForStatus(value) {
  const normalized = String(value).toLowerCase();
  if (["active", "enabled", "2"].includes(normalized)) return "success";
  if (["inactive", "disabled", "3", "4"].includes(normalized)) return "neutral";
  return "neutral";
}
