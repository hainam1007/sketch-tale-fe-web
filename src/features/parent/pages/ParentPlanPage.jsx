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
  const percentage = limit ? Math.min(100, used / limit * 100) : 0;
  return <div className="parent-plan-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">GÓI VÀ HẠN MỨC</p><h1>Gói đang đồng hành cùng gia đình</h1><p>Quyền truy cập và hạn mức được trả về từ tài khoản của bạn.</p></div><span className="parent-feature-icon"><Package size={29} aria-hidden="true" /></span></div><div className="plan-summary-grid"><section className="plan-summary-card plan-summary-primary"><span className="parent-panel-kicker">GÓI HIỆN TẠI</span><div className="plan-name-row"><h2>{entitlement.plan}</h2><StatusBadge value={entitlement.plan} tone="gold" /></div><p>Hạn mức hồ sơ bé được áp dụng cho tài khoản này.</p><Link className="parent-text-link" to="/parent/children">Quản lý hồ sơ bé <ArrowRight size={16} aria-hidden="true" /></Link></section><section className="plan-summary-card"><div className="plan-stat-icon"><Gauge size={21} aria-hidden="true" /></div><span className="plan-stat-label">HỒ SƠ ĐÃ DÙNG</span><strong className="plan-stat-value">{used}<small>/ {limit ?? "∞"}</small></strong>{limit !== null && <div className="parent-progress" role="progressbar" aria-valuenow={used} aria-valuemin="0" aria-valuemax={limit} aria-label="Số hồ sơ đã dùng"><span style={{ width: `${percentage}%` }} /></div>}<p>{remaining === null ? "Không giới hạn theo gói hiện tại." : remaining ? `Còn ${remaining} hồ sơ có thể tạo.` : "Đã dùng hết hạn mức hồ sơ."}</p></section><section className="plan-summary-card"><div className="plan-stat-icon"><CalendarBlank size={21} aria-hidden="true" /></div><span className="plan-stat-label">ĐẶT LẠI / MÚI GIỜ</span><strong className="plan-reset-value">{entitlement.resetAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(entitlement.resetAt)) : "Không áp dụng"}</strong><p>{entitlement.timezone || "Múi giờ chưa được cung cấp."}</p></section></div><section className="plan-entitlement-card"><div><h2>Quyền lợi đang được server xác nhận</h2><p>Hạn mức thay đổi theo phản hồi tài khoản. Các tính năng thanh toán sẽ được bổ sung khi có contract billing.</p></div><ul><li><CheckCircle size={17} aria-hidden="true" /> Tạo hồ sơ trong phạm vi hạn mức</li><li><CheckCircle size={17} aria-hidden="true" /> Cấu hình riêng cho từng bé</li><li><CheckCircle size={17} aria-hidden="true" /> Theo dõi thư viện và nội dung đã duyệt</li></ul></section></div>;
}
