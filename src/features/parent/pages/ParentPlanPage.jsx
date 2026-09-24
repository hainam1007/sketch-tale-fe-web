import { ArrowRight, CalendarBlank, CheckCircle, Gauge, Package } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function ParentPlanPage() {
  const { user } = useAuth();
  const entitlementQuery = useQuery({ queryKey: queryKeys.entitlement(user.id), queryFn: ({ signal }) => childrenService.entitlement({ signal }) });
  if (entitlementQuery.isLoading) return <LoadingState label="Đang tải gói và hạn mức" />;
  if (entitlementQuery.isError) return <ErrorState title="Không thể tải thông tin gói" message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} />;
  const entitlement = entitlementQuery.data;
  const limit = entitlement.childProfileLimit;
  const used = entitlement.usedChildProfiles;
  const remaining = limit === null ? null : Math.max(0, limit - used);
  const percentage = limit ? Math.min(100, used / limit * 100) : 8;
  return <div className="parent-plan-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">GÓI / USAGE</p><h1>Gói đang đồng hành cùng gia đình</h1><p>Số liệu này đến từ entitlement server; frontend không tự cấp quyền hoặc thay đổi hạn mức.</p></div><span className="parent-feature-icon"><Package size={29} aria-hidden="true" /></span></div><div className="plan-summary-grid"><section className="plan-summary-card plan-summary-primary"><span className="parent-panel-kicker">GÓI HIỆN TẠI</span><div className="plan-name-row"><h2>{entitlement.plan}</h2><StatusBadge value={entitlement.plan} tone="gold" /></div><p>Hạn mức hồ sơ bé được áp dụng cho tài khoản này.</p><Link className="parent-text-link" to="/parent/children">Quản lý hồ sơ bé <ArrowRight size={16} aria-hidden="true" /></Link></section><section className="plan-summary-card"><div className="plan-stat-icon"><Gauge size={21} aria-hidden="true" /></div><span className="plan-stat-label">HỒ SƠ ĐÃ DÙNG</span><strong className="plan-stat-value">{used}<small>/ {limit ?? "∞"}</small></strong><div className="parent-progress"><span style={{ width: `${percentage}%` }} /></div><p>{remaining === null ? "Không giới hạn theo entitlement hiện tại." : remaining ? `Còn ${remaining} hồ sơ có thể tạo.` : "Đã dùng hết hạn mức hồ sơ."}</p></section><section className="plan-summary-card"><div className="plan-stat-icon"><CalendarBlank size={21} aria-hidden="true" /></div><span className="plan-stat-label">RESET / TIMEZONE</span><strong className="plan-reset-value">{entitlement.resetAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(entitlement.resetAt)) : "Theo cấu hình hệ thống"}</strong><p>{entitlement.timezone || "Timezone chưa được cung cấp."}</p></section></div><section className="plan-entitlement-card"><div><h2>Quyền lợi đang được server xác nhận</h2><p>Ứng dụng hiển thị trạng thái để phụ huynh hiểu giới hạn; nâng cấp/thanh toán sẽ nối sau khi có contract billing.</p></div><ul><li><CheckCircle size={17} aria-hidden="true" /> Tạo hồ sơ trong phạm vi quota</li><li><CheckCircle size={17} aria-hidden="true" /> Cấu hình settings riêng cho từng bé</li><li><CheckCircle size={17} aria-hidden="true" /> Theo dõi thư viện và nội dung được duyệt</li></ul></section></div>;
}
