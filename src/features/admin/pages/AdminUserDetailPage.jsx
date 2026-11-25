import { ArrowLeft, Check, Package, PencilSimple, UserCircle, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/useAuth";
import { adminService } from "../services/adminService";
import { adminCatalogService } from "../services/adminCatalogService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, SuccessState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { adminRoleLabels } from "../models";

const userUpdateFields = ["firstName", "lastName", "email", "phoneNumber", "dob", "gender", "role"];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
}

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  return <AdminUserDetail key={`${user.id}:${userId}`} />;
}

function AdminUserDetail() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const backTo = (requestedReturnTo === "/admin/users" || requestedReturnTo?.startsWith("/admin/users?")) ? requestedReturnTo : "/admin/users";
  const queryClient = useQueryClient();

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [editDraft, setEditDraft] = useState(null);
  const [editOriginal, setEditOriginal] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userQuery = useQuery({
    queryKey: queryKeys.adminUser(user.id, userId),
    queryFn: ({ signal }) => adminService.getUser({ userId, signal }),
  });

  const plansQuery = useQuery({
    queryKey: ["admin-subscription-plans", user.id],
    queryFn: ({ signal }) => adminCatalogService.list({ kind: "plans", signal }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId }) => adminService.updateParentProfilePlan({ profileId: userQuery.data.profileId, subscriptionPlanId: planId }),
    onSuccess: () => {
      setSuccessMsg("Đã cập nhật gói dịch vụ cho phụ huynh thành công.");
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(user.id, userId) });
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
    onError: (err) => {
      setErrorMsg(err.message || "Không thể cập nhật gói cước.");
      setSuccessMsg("");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload) => adminService.updateUser({ userId, payload }),
    onSuccess: async () => {
      setEditDraft(null);
      setErrorMsg("");
      setSuccessMsg("Đã cập nhật thông tin tài khoản.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(user.id, userId) });
      await queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview(user.id) });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit", user.id] });
    },
    onError: (error) => {
      setErrorMsg(error.message || "Không thể cập nhật tài khoản.");
      setSuccessMsg("");
    },
  });

  if (userQuery.isLoading) return <LoadingState label="Đang tải thông tin hồ sơ phụ huynh" />;
  if (userQuery.isError && !userQuery.data) return <ErrorState title="Không thể mở hồ sơ" message={userQuery.error.message} onRetry={() => userQuery.refetch()} />;

  const target = userQuery.data;
  const plans = plansQuery.data || [];
  const currentPlanId = selectedPlanId || target.subscriptionPlanId || "";
  const canUpdateUser = ["firstName", "lastName", "email", "dob", "gender"].every((field) => Object.hasOwn(target, field));

  function beginUserEdit() {
    setEditOriginal(target);
    setEditDraft({
      ...Object.fromEntries(userUpdateFields.map((field) => [field, target[field] ?? ""])),
      displayName: target.name || "",
    });
    updateUserMutation.reset();
    setErrorMsg("");
    setSuccessMsg("");
  }

  function updateDisplayName(value) {
    const nameParts = value.trim().split(/\s+/).filter(Boolean);
    const lastName = nameParts.length > 1 ? nameParts.pop() : "";
    setEditDraft((current) => ({
      ...current,
      displayName: value,
      firstName: nameParts.join(" "),
      lastName,
    }));
  }

  function submitUserEdit(event) {
    event.preventDefault();
    if (!editDraft || !canUpdateUser || userQuery.isError || updateUserMutation.isPending) return;
    if (!editDraft.displayName.trim()) {
      setErrorMsg("Tên tài khoản không được để trống.");
      return;
    }
    const payload = {};
    const originalDisplayName = [editOriginal.firstName, editOriginal.lastName].filter(Boolean).join(" ") || editOriginal.username || "";
    const displayNameChanged = editDraft.displayName.trim() !== originalDisplayName;
    if (displayNameChanged) {
      payload.firstName = editDraft.firstName.trim();
      payload.lastName = editDraft.lastName.trim();
    }
    for (const field of ["firstName", "lastName", "email", "phoneNumber", "dob", "gender"]) {
      if (["firstName", "lastName"].includes(field)) continue;
      if (!Object.hasOwn(editOriginal, field)) continue;
      let value = editDraft[field];
      if (field === "gender") value = value === "" ? null : value === true || value === "true";
      if ((editOriginal[field] ?? "") === (value ?? "")) continue;
      if (["email", "dob", "gender"].includes(field) && (value === "" || value === null)) {
        setErrorMsg("Vui lòng giữ giá trị hiện tại hoặc nhập giá trị mới cho email, ngày sinh và giới tính.");
        return;
      }
      payload[field] = value;
    }
    if (!Object.keys(payload).length) { setEditDraft(null); return; }
    updateUserMutation.mutate(payload);
  }

  function handleAssignPlan(event) {
    event.preventDefault();
    if (!currentPlanId || !target.allowedActions?.includes("change_plan")) return;
    updatePlanMutation.mutate({ planId: currentPlanId });
  }

  return (
    <div className="workspace-dashboard admin-user-detail">
      <div className="admin-detail-back">
        <Link className="workspace-button workspace-button-quiet" to={backTo}>
          <ArrowLeft size={17} aria-hidden="true" /> Quay lại danh sách hồ sơ
        </Link>
      </div>

      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / QUẢN LÝ TÀI KHOẢN</p>
          <h1>Chi tiết tài khoản</h1>
        </div>
        {target.profileId
          ? <StatusBadge value={target.plan || "Free"} label={"Plan: " + (target.plan || "Free")} tone={target.plan?.toLowerCase().includes("pro") ? "success" : target.plan?.toLowerCase().includes("plus") ? "accent" : "neutral"} />
          : <StatusBadge value="unavailable" label={target.profileLookupError ? "Parent profile chưa tải được" : "Kh\u00f4ng c\u00f3 Parent profile"} />}
      </div>

      <section className="admin-user-detail-card">
        <div className="admin-detail-identity">
          <span className="admin-detail-avatar">
            <UserCircle size={49} weight="duotone" aria-hidden="true" />
          </span>
          <div>
          <span className="workspace-eyebrow">Tài khoản</span>
            {editDraft
              ? <input className="admin-detail-name-input" aria-label="Tên tài khoản" form="admin-user-edit-form" required value={editDraft.displayName} disabled={updateUserMutation.isPending} onChange={(event) => updateDisplayName(event.target.value)} />
              : <h2>{target.name || "Phụ huynh"}</h2>}
            <p>{target.email || "Tài khoản phụ huynh"}</p>
          </div>
          <div className="admin-detail-actions">
            {editDraft ? <>
              <button className="workspace-button workspace-button-quiet" type="button" disabled={updateUserMutation.isPending} onClick={() => { setEditDraft(null); setErrorMsg(""); }}>
                Hủy
              </button>
              <button className="workspace-button" type="submit" form="admin-user-edit-form" disabled={updateUserMutation.isPending}>
                <Check size={16} aria-hidden="true" /> {updateUserMutation.isPending ? "Đang lưu…" : "Lưu"}
              </button>
            </> : <button className="workspace-button workspace-button-quiet" type="button" disabled={!canUpdateUser} title={!canUpdateUser ? "GET /users chưa trả đủ field để gửi PUT an toàn." : undefined} onClick={beginUserEdit}>
              <PencilSimple size={16} aria-hidden="true" /> Sửa
            </button>}
          </div>
        </div>

        <dl className="admin-user-meta">
          <div>
            <dt>Tên đăng nhập</dt>
            <dd>{target.username || "Chưa có dữ liệu"}</dd>
          </div>
          <div>
            <dt>Vai trò tài khoản</dt>
            <dd>{adminRoleLabels[target.role] || target.role || "Chưa có dữ liệu"}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{target.status === "locked" ? "Đã khóa" : target.status === "active" ? "Hoạt động" : "Chưa có dữ liệu"}</dd>
          </div>
          <div>
            <dt>Ngày tạo</dt>
            <dd>{formatDate(target.createdAt)}</dd>
          </div>
          {target.profileId && <>
            <div><dt>Gói dịch vụ hiện tại</dt><dd><strong>{target.plan || "Chưa có dữ liệu"}</strong></dd></div>
            <div><dt>Credit khả dụng</dt><dd>{target.remainingMonthlyCredit ?? "Chưa có dữ liệu"}{target.remainingMonthlyCredit === null ? "" : " Credit"}</dd></div>
            <div><dt>Hồ sơ con còn lại</dt><dd>{target.remainingChildProfile ?? "Chưa có dữ liệu"}</dd></div>
          </>}
          <div>
            <dt>Email tài khoản</dt>
            <dd>{target.email || "Chưa cập nhật email"}</dd>
          </div>
        </dl>

        {userQuery.isError && <p role="alert">Chưa đọc lại được tài khoản. <button type="button" onClick={() => userQuery.refetch()}>Đọc lại</button></p>}
        {successMsg && <SuccessState>{successMsg}</SuccessState>}
        {errorMsg && <p className="admin-mutation-error" role="alert">{errorMsg}</p>}

        {!canUpdateUser && <span className="admin-field-note">GET /users cần trả đủ field của AdminUpdateUserDto trước khi bật sửa.</span>}

        {editDraft && <form id="admin-user-edit-form" className="admin-limits-card admin-user-edit-form" onSubmit={submitUserEdit}>
          <div className="admin-limit-grid">
            <label className="admin-limit-field"><span>Email</span><input type="email" value={editDraft.email} onChange={(event) => setEditDraft((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="admin-limit-field"><span>Số điện thoại</span><input value={editDraft.phoneNumber} disabled={!Object.hasOwn(target, "phoneNumber")} onChange={(event) => setEditDraft((current) => ({ ...current, phoneNumber: event.target.value }))} /></label>
            <label className="admin-limit-field"><span>Ngày sinh</span><input type="date" value={String(editDraft.dob || "").slice(0, 10)} onChange={(event) => setEditDraft((current) => ({ ...current, dob: event.target.value }))} /></label>
            <label className="admin-limit-field"><span>Giới tính</span><select value={(editDraft.gender === true || editDraft.gender === "true") ? "true" : (editDraft.gender === false || editDraft.gender === "false") ? "false" : ""} onChange={(event) => setEditDraft((current) => ({ ...current, gender: event.target.value }))}><option value="">Chưa thiết lập</option><option value="true">Nam</option><option value="false">Nữ</option></select></label>
            <label className="admin-limit-field"><span>Vai trò (chỉ đọc)</span><input value={adminRoleLabels[editDraft.role] || editDraft.role} readOnly /></label>
          </div>
          <p className="admin-field-note">Chưa hỗ trợ đổi vai trò hoặc xóa email, ngày sinh, giới tính. Số điện thoại chỉ sửa được khi hồ sơ trả về giá trị hiện tại.</p>
          {updateUserMutation.isError && <p className="admin-mutation-error" role="alert"><WarningCircle size={16} aria-hidden="true" /> {updateUserMutation.error.message}</p>}
        </form>}

        {target.profileId && <div className="admin-plan-assignment-box">
          <p className="admin-field-note">Tính năng đổi gói hiện chưa khả dụng.</p>
          <h3>
            <Package size={20} aria-hidden="true" /> Gán gói dịch vụ mới
          </h3>
          <form className="admin-plan-form" onSubmit={handleAssignPlan}>
            <label>
              <span>Chọn gói dịch vụ để gán:</span>
              <select
                value={currentPlanId}
                onChange={(event) => setSelectedPlanId(event.target.value)}
                disabled={updatePlanMutation.isPending || plansQuery.isLoading}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {plan.monthlyCreditLimit} credit/tháng ({plan.price ? `${Number(plan.price).toLocaleString("vi-VN")} đ` : "0 đ"})
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-plan-actions">
              <button
                className="workspace-button"
                type="submit"
                disabled title="Tính năng đổi gói hiện chưa khả dụng"
              >
                <Check size={18} aria-hidden="true" />
                {updatePlanMutation.isPending ? "Đang cập nhật…" : "Cập nhật gói cước"}
              </button>
            </div>
          </form>
        </div>}
      </section>
    </div>
  );
}

