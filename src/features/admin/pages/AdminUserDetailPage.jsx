import { ArrowLeft, Check, Package, Sparkle, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { adminService } from "../services/adminService";
import { adminCatalogService } from "../services/adminCatalogService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState, SuccessState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

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
  const { user } = useAuth();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const backTo = (requestedReturnTo === "/admin/users" || requestedReturnTo?.startsWith("/admin/users?")) ? requestedReturnTo : "/admin/users";
  const queryClient = useQueryClient();

  const [selectedPlanId, setSelectedPlanId] = useState("");
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
    mutationFn: ({ planId }) => adminService.updateParentProfilePlan({ profileId: userId, subscriptionPlanId: planId }),
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

  const trialMutation = useMutation({
    mutationFn: () => adminService.markTrialPlanUsed({ profileId: userId }),
    onSuccess: () => {
      setSuccessMsg("Đã đánh dấu tài khoản đã dùng quyền dùng thử.");
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(user.id, userId) });
      queryClient.invalidateQueries({ queryKey: ["admin-users", user.id] });
    },
    onError: (err) => {
      setErrorMsg(err.message || "Không thể đánh dấu gói dùng thử.");
      setSuccessMsg("");
    },
  });

  if (userQuery.isLoading) return <LoadingState label="Đang tải thông tin hồ sơ phụ huynh" />;
  if (userQuery.isError) return <ErrorState title="Không thể mở hồ sơ" message={userQuery.error.message} onRetry={() => userQuery.refetch()} />;

  const target = userQuery.data;
  const plans = plansQuery.data || [];
  const currentPlanId = selectedPlanId || target.subscriptionPlanId || (plans[0]?.id || "");

  function handleAssignPlan(event) {
    event.preventDefault();
    if (!currentPlanId) return;
    updatePlanMutation.mutate({ planId: currentPlanId });
  }

  return (
    <div className="workspace-dashboard admin-user-detail">
      <div className="admin-detail-back">
        <Link to={backTo}>
          <ArrowLeft size={17} aria-hidden="true" /> Quay lại danh sách hồ sơ
        </Link>
      </div>

      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / QUẢN LÝ HỒ SƠ</p>
          <h1>Chi tiết Hồ sơ Phụ huynh</h1>
          <p>Xem định mức credit, thông tin gói và gán gói dịch vụ trực tiếp cho tài khoản.</p>
        </div>
        <StatusBadge
          value={target.plan || "Free"}
          label={`Gói: ${target.plan || "Free"}`}
          tone={target.plan?.toLowerCase().includes("pro") ? "success" : target.plan?.toLowerCase().includes("plus") ? "accent" : "neutral"}
        />
      </div>

      <section className="admin-user-detail-card">
        <div className="admin-detail-identity">
          <span className="admin-detail-avatar">
            <UserCircle size={49} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <span className="workspace-eyebrow">Hồ sơ Phụ huynh</span>
            <h2>{target.name || "Phụ huynh"}</h2>
            <p>{target.email || "Tài khoản phụ huynh"}</p>
          </div>
        </div>

        <dl className="admin-user-meta">
          <div>
            <dt>Gói dịch vụ hiện tại</dt>
            <dd><strong>{target.plan || "Free"}</strong></dd>
          </div>
          <div>
            <dt>Credit khả dụng</dt>
            <dd>{target.remainingMonthlyCredit} Credit</dd>
          </div>
          <div>
            <dt>Giới hạn hồ sơ con</dt>
            <dd>{target.remainingChildProfile} hồ sơ</dd>
          </div>
          <div>
            <dt>Email tài khoản</dt>
            <dd>{target.email || "Chưa cập nhật email"}</dd>
          </div>
          <div>
            <dt>Vai trò tài khoản</dt>
            <dd>{target.role === "admin" ? "Quản trị viên" : target.role === "content_manager" ? "Content Manager" : "Phụ huynh"}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{target.status === "locked" ? "Đã khóa" : "Hoạt động"}</dd>
          </div>
        </dl>

        {successMsg && <SuccessState>{successMsg}</SuccessState>}
        {errorMsg && <p className="admin-mutation-error" role="alert">{errorMsg}</p>}

        <div className="admin-plan-assignment-box">
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
                disabled={updatePlanMutation.isPending || !currentPlanId}
              >
                <Check size={18} aria-hidden="true" />
                {updatePlanMutation.isPending ? "Đang cập nhật…" : "Cập nhật gói cước"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

