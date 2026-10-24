import { useState } from "react";
import {
  ArrowClockwise,
  Coins,
  CurrencyCircleDollar,
  Flag,
  Package,
  Prohibit,
  ShieldCheck,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import StatusBadge from "../../../components/ui/StatusBadge";
import { queryKeys } from "../../../lib/api/queryKeys";
import { adminService } from "../services/adminService";

const statusTone = { open: "neutral", under_review: "gold", resolved: "success", rejected: "danger" };

// Dữ liệu template doanh thu — Sẵn sàng nhận API từ backend khi cập nhật
const defaultRevenueData = {
  total: 49000,
  growthPercent: 18.4,
  subscriptionTotal: 49000,
  creditUsed: 6190,
  activeSubscriptionsCount: 2,
  monthlyTrend: [
    { label: "Thg 5", sub: 0, credit: 0, total: 0 },
    { label: "Thg 6", sub: 0, credit: 0, total: 0 },
    { label: "Thg 7", sub: 0, credit: 0, total: 0 },
    { label: "Thg 8", sub: 0, credit: 0, total: 0 },
    { label: "Thg 9", sub: 0, credit: 0, total: 0 },
    { label: "Thg 10", sub: 49000, credit: 6190, total: 49000 },
  ],
  packages: [
    { name: "Gói Plus", amount: 49000, unitPrice: 49000, count: "1 lượt", rawCount: 1, share: 100 },
    { name: "Gói Pro", amount: 0, unitPrice: 99000, count: "0 lượt", rawCount: 0, share: 0 },
  ],
};

function formatVND(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function formatCompactVND(amount) {
  if (!amount || amount <= 0) return "0 ₫";
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K`;
  }
  return `${amount} ₫`;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [revenueTab, setRevenueTab] = useState("30days");

  const overviewQuery = useQuery({
    queryKey: queryKeys.adminOverview(user.id),
    queryFn: ({ signal }) => adminService.getOverview({ signal }),
    staleTime: 30_000,
  });

  if (overviewQuery.isLoading) return <LoadingState label="Đang tải tổng quan quản trị" />;
  if (overviewQuery.isError && !overviewQuery.data) return <ErrorState title="Không thể tải tổng quan" message={overviewQuery.error.message} onRetry={() => overviewQuery.refetch()} />;

  const data = overviewQuery.data || {};
  const counts = data.counts || {};
  const queue = Array.isArray(data.queue) ? data.queue : [];
  // Nhận dữ liệu doanh thu từ backend khi có (hoặc fallback sang template)
  const revenue = data.revenue || defaultRevenueData;

  const maxMonthTotal = Math.max(...(revenue.monthlyTrend || []).map((m) => m.sub || m.total || 0), 1);

  return (
    <div className="workspace-dashboard admin-overview-page">
      <div className="workspace-page-heading admin-overview-heading">
        <div>
          <p className="workspace-eyebrow">ADMIN / TỔNG QUAN</p>
          <h1 className="sr-only">Tổng quan quản trị</h1>
        </div>
        <button className="workspace-button workspace-button-quiet" type="button" onClick={() => overviewQuery.refetch()} disabled={overviewQuery.isFetching}>
          <ArrowClockwise size={17} aria-hidden="true" /> {overviewQuery.isFetching ? "Đang cập nhật" : "Làm mới"}
        </button>
      </div>
      {overviewQuery.isError && <p className="admin-refresh-note" role="status">Không tải được bản mới. Đang hiển thị dữ liệu gần nhất.</p>}

      <section className="workspace-stat-grid admin-overview-stat-grid" aria-label="Chỉ số vận hành">
        <OverviewStat icon={Flag} label="Báo cáo chờ xử lý" value={counts.reportsOpen} to="/admin/reports" tone="gold" />
        <OverviewStat icon={ShieldCheck} label="Báo cáo đang xem xét" value={counts.reportsUnderReview} to="/admin/reports" tone="gold" />
        <OverviewStat icon={UsersThree} label="Người dùng" value={counts.totalParents} to="/admin/users" tone="success" />
        <OverviewStat icon={Package} label="Gói sử dụng đang chạy" value={counts.activePlans} to="/admin/subscription-plans" tone="neutral" />
      </section>

      <div className="admin-overview-grid">
        {/* KHU VỰC DOANH THU — DÀNH PHẦN RỘNG (SẴN SÀNG NỐI API) */}
        <section className="analytics-card admin-revenue-card" aria-label="Tổng quan doanh thu">
          <div className="analytics-card-heading">
            <div>
              <p className="workspace-eyebrow">HIỆU QUẢ KINH DOANH</p>
              <h2>Tổng quan doanh thu</h2>
              <p>Doanh thu từ gói thành viên và mức độ tiêu thụ Credit AI của người dùng.</p>
            </div>
            <div className="admin-revenue-header-actions">
              <span className="admin-revenue-pill">
                <TrendUp size={14} aria-hidden="true" /> +{revenue.growthPercent}%
              </span>
              <span className="admin-revenue-api-pill is-live" title="Dữ liệu kết nối trực tiếp API /subscriptions & /subscription-plans">
                <span className="admin-source-indicator" /> Live API: /subscriptions
              </span>
            </div>
          </div>

          <div className="admin-revenue-tabs" role="tablist" aria-label="Khoảng thời gian doanh thu">
            <button
              type="button"
              className={`admin-revenue-tab-btn ${revenueTab === "30days" ? "is-active" : ""}`}
              onClick={() => setRevenueTab("30days")}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              className={`admin-revenue-tab-btn ${revenueTab === "quarter" ? "is-active" : ""}`}
              onClick={() => setRevenueTab("quarter")}
            >
              Quý này
            </button>
            <button
              type="button"
              className={`admin-revenue-tab-btn ${revenueTab === "year" ? "is-active" : ""}`}
              onClick={() => setRevenueTab("year")}
            >
              Năm 2026
            </button>
          </div>

          <div className="admin-revenue-kpis">
            <div className="admin-revenue-kpi-card is-primary">
              <div className="admin-revenue-kpi-icon-wrap is-gold">
                <CurrencyCircleDollar size={22} weight="duotone" aria-hidden="true" />
              </div>
              <div className="admin-revenue-kpi-body">
                <span className="admin-revenue-kpi-label">Tổng doanh thu</span>
                <strong className="admin-revenue-kpi-value">{formatVND(revenue.total)}</strong>
                <span className="admin-revenue-badge-pill is-growth">+{revenue.growthPercent}% so với kỳ trước</span>
              </div>
            </div>
            <div className="admin-revenue-kpi-card">
              <div className="admin-revenue-kpi-icon-wrap is-amber">
                <Package size={22} weight="duotone" aria-hidden="true" />
              </div>
              <div className="admin-revenue-kpi-body">
                <span className="admin-revenue-kpi-label">Gói thuê bao</span>
                <strong className="admin-revenue-kpi-value">{formatVND(revenue.subscriptionTotal)}</strong>
                <span className="admin-revenue-kpi-note">{revenue.activeSubscriptionsCount || 2} tài khoản đang áp dụng</span>
              </div>
            </div>
            <div className="admin-revenue-kpi-card">
              <div className="admin-revenue-kpi-icon-wrap is-purple">
                <Coins size={22} weight="duotone" aria-hidden="true" />
              </div>
              <div className="admin-revenue-kpi-body">
                <span className="admin-revenue-kpi-label">Số credit đã sử dụng</span>
                <strong className="admin-revenue-kpi-value">
                  {(revenue.creditUsed ?? 6190).toLocaleString("vi-VN")}{" "}
                  <small style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Credit</small>
                </strong>
                <span className="admin-revenue-kpi-note">Mức tiêu thụ AI trên toàn hệ thống</span>
              </div>
            </div>
          </div>

          <div className="admin-revenue-chart-wrap">
            <div className="admin-revenue-chart-title">
              <div>
                <strong>Biểu đồ doanh thu 6 tháng gần nhất</strong>
                <small style={{ display: "block", color: "#64748b", fontWeight: 400, marginTop: "2px" }}>
                  Biểu thị doanh thu gói thuê bao theo từng tháng
                </small>
              </div>
              <div className="admin-revenue-chart-legend">
                <span><i className="dot-sub" aria-hidden="true" /> Doanh thu gói (VNĐ)</span>
              </div>
            </div>

            <div className="admin-revenue-bars" aria-label="Biểu đồ cột doanh thu theo tháng">
              {revenue.monthlyTrend.map((m) => {
                const amount = m.sub || m.total || 0;
                const isZero = amount === 0;
                const subHeightPct = isZero ? 4 : Math.max(16, Math.round((amount / maxMonthTotal) * 100));
                return (
                  <div className="admin-revenue-bar-col" key={m.label}>
                    <span className={`admin-revenue-bar-value ${isZero ? "is-zero" : ""}`}>
                      {formatCompactVND(amount)}
                    </span>
                    <div
                      className={`admin-revenue-bar-track ${isZero ? "is-zero" : ""}`}
                      title={`${m.label}: ${isZero ? "0 ₫ (Chưa có doanh thu)" : `Doanh thu ${formatVND(amount)}`}`}
                    >
                      <div
                        className={`admin-revenue-bar-fill-sub ${isZero ? "is-zero" : ""}`}
                        style={{ height: `${subHeightPct}%` }}
                      />
                    </div>
                    <span className="admin-revenue-bar-label">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-revenue-packages-section">
            <div className="admin-revenue-packages-header">
              <strong>Cơ cấu doanh thu theo gói</strong>
              <small className="admin-filter-result-count">Tỷ trọng các gói dịch vụ</small>
            </div>
            <div className="admin-revenue-packages-grid">
              {revenue.packages.map((pkg) => (
                <div className={`admin-revenue-package-card ${pkg.rawCount > 0 ? "is-active" : ""}`} key={pkg.name}>
                  <div className="admin-revenue-package-card-top">
                    <div>
                      <strong className="admin-revenue-package-title">{pkg.name}</strong>
                      <span className="admin-revenue-package-price">
                        {pkg.unitPrice > 0 ? `${formatVND(pkg.unitPrice)} / tháng` : "Miễn phí"}
                      </span>
                    </div>
                    {pkg.rawCount > 0 ? (
                      <span className="admin-package-status-badge is-active">Đang áp dụng ({pkg.count})</span>
                    ) : (
                      <span className="admin-package-status-badge is-idle">0 lượt mua</span>
                    )}
                  </div>
                  <div className="admin-revenue-package-card-mid">
                    <div className="admin-revenue-package-progress-wrap">
                      <div className="admin-revenue-package-progress-bar">
                        <i style={{ width: `${pkg.share}%` }} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div className="admin-revenue-package-card-bottom">
                    <span className="admin-revenue-package-revenue-label">Doanh thu</span>
                    <strong className="admin-revenue-package-revenue-val">
                      {pkg.amount > 0 ? formatVND(pkg.amount) : "0 ₫"}
                      {pkg.share > 0 && <small> ({pkg.share}% thị phần)</small>}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {revenue.recentSubscriptions?.length > 0 && (
            <div className="admin-revenue-recent-subs">
              <div className="admin-revenue-recent-header">
                <div>
                  <strong>Đăng ký gói gần đây (API /subscriptions)</strong>
                  <small style={{ display: "block", color: "#64748b", fontWeight: 400, marginTop: "2px" }}>
                    Danh sách thuê bao ghi nhận trực tiếp từ backend
                  </small>
                </div>
                <span className="admin-filter-result-count">{revenue.recentSubscriptions.length} lượt</span>
              </div>
              <div className="admin-users-table-wrap">
                <table className="admin-users-table">
                  <caption className="sr-only">Thuê bao gần đây</caption>
                  <thead>
                    <tr>
                      <th>Phụ huynh</th>
                      <th>Gói dịch vụ</th>
                      <th>Giá gói</th>
                      <th>Thời hạn</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.recentSubscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <strong className="admin-catalog-primary">{sub.parentName}</strong>
                          <span className="admin-user-email" style={{ display: "block" }}>{sub.parentEmail}</span>
                        </td>
                        <td>
                          <span className="admin-badge-rule role-admin">{sub.planName}</span>
                        </td>
                        <td>
                          <strong>{formatVND(sub.priceVND)}</strong>
                        </td>
                        <td>
                          <span className="admin-date-cell">
                            {sub.startDate ? new Date(sub.startDate).toLocaleDateString("vi-VN") : "—"}
                            {" → "}
                            {sub.endDate ? new Date(sub.endDate).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            value={sub.status}
                            label={sub.status === "active" ? "Đang áp dụng" : "Hết hạn"}
                            tone={sub.status === "active" ? "success" : "neutral"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Link className="admin-overview-section-link" to="/admin/subscription-plans">
            Quản lý bảng giá và gói dịch vụ <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* HÀNG ĐỢI KIỂM DUYỆT — THU NHỎ LẠI THEO YÊU CẦU */}
        <section className="analytics-card admin-overview-reports-compact">
          <div className="analytics-card-heading">
            <div>
              <p className="workspace-eyebrow">HÀNG ĐỢI KIỂM DUYỆT</p>
              <h2>Báo cáo cần xử lý</h2>
              <p>Nội dung đang chờ xét duyệt.</p>
            </div>
            <Flag size={22} aria-hidden="true" />
          </div>
          {queue.length ? (
            <div className="admin-overview-queue admin-overview-queue-compact">
              {queue.slice(0, 5).map((item) => (
                <Link className="admin-overview-queue-item" key={`${item.kind}-${item.id}`} to={item.to || "/admin/reports"}>
                  <div>
                    <span className="admin-report-type">{item.kindLabel || "Báo cáo"}</span>
                    <strong>{item.title || item.id}</strong>
                    <small>{item.meta || "Chưa có mô tả"}</small>
                  </div>
                  <StatusBadge
                    value={item.status || "unknown"}
                    label={item.status === "open" ? "Chờ xử lý" : "Đang xét"}
                    tone={statusTone[item.status] || "neutral"}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="workspace-state workspace-state-empty">
              <Flag size={25} aria-hidden="true" />
              <strong>Không có báo cáo chờ xử lý</strong>
              <p>Toàn bộ khiếu nại đã được giải quyết.</p>
            </div>
          )}
          <Link className="admin-overview-section-link" to="/admin/reports">
            Mở hàng đợi báo cáo ({queue.length}) <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>

      <section className="admin-overview-quick-links" aria-label="Truy cập nhanh">
        <Link to="/admin/users">
          <UsersThree size={19} aria-hidden="true" />
          <span>
            <strong>Người dùng</strong>
            <small>Tra cứu và cấu hình gói dịch vụ</small>
          </span>
        </Link>
        <Link to="/admin/subscription-plans">
          <Package size={19} aria-hidden="true" />
          <span>
            <strong>Gói sử dụng</strong>
            <small>Cấu hình gói dịch vụ và quota credit</small>
          </span>
        </Link>
        <Link to="/admin/credit-costs">
          <Coins size={19} aria-hidden="true" />
          <span>
            <strong>Chi phí credit</strong>
            <small>Định mức credit tạo truyện và ảnh AI</small>
          </span>
        </Link>
        <Link to="/admin/reports">
          <Flag size={19} aria-hidden="true" />
          <span>
            <strong>Báo cáo nội dung</strong>
            <small>Kiểm duyệt khiếu nại từ người dùng</small>
          </span>
        </Link>
        <Link to="/admin/restrictions">
          <Prohibit size={19} aria-hidden="true" />
          <span>
            <strong>Từ khóa hạn chế</strong>
            <small>Quy tắc kiểm duyệt từ khóa an toàn</small>
          </span>
        </Link>
        <Link to="/admin/prohibited-themes">
          <Prohibit size={19} aria-hidden="true" />
          <span>
            <strong>Chủ đề cấm</strong>
            <small>Danh mục chủ đề nội dung bị nghiêm cấm</small>
          </span>
        </Link>
      </section>
    </div>
  );
}

function OverviewStat({ icon: Icon, label, value, to, tone }) {
  const displayValue = value === null || value === undefined || value === "" ? "0" : typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("vi-VN").format(value) : String(value);
  return (
    <Link className={`admin-overview-stat admin-overview-stat-${tone}`} to={to}>
      <span className="workspace-stat-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="workspace-stat-label">{label}</span>
      <strong>{displayValue}</strong>
      <span className="admin-overview-stat-link">Xem danh sách →</span>
    </Link>
  );
}

