import { ArrowRight, Baby, BookOpen, Check, Clock, GearSix, Plus, UsersThree } from "@phosphor-icons/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import "../parent-overview.css";

const EMPTY_CHILDREN = [];

export default function ParentOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childrenQuery = useQuery({
    queryKey: queryKeys.children(user.id),
    queryFn: ({ signal }) => childrenService.list({ signal }),
  });
  const children = useMemo(() => childrenQuery.data?.items || EMPTY_CHILDREN, [childrenQuery.data]);
  const simulate = searchParams.get("simulate") || "";
  const range = searchParams.get("range");
  const legacyPreviewQuery = useQuery({
    queryKey: queryKeys.parentDashboard(user.id, range || "7d", simulate),
    queryFn: ({ signal }) => childrenService.dashboard({ range: range || "7d", simulate, signal }),
    enabled: Boolean(simulate),
  });

  useEffect(() => {
    if (children.length !== 1) return;
    const suffix = new URLSearchParams({ ...(range ? { range } : {}), ...(simulate ? { simulate } : {}) }).toString();
    navigate(`/parent/children/${children[0].id}/dashboard${suffix ? `?${suffix}` : ""}`, { replace: true });
  }, [children, navigate, range, simulate]);

  if (childrenQuery.isLoading) return <LoadingState label="Đang kiểm tra hồ sơ bé" />;
  if (childrenQuery.isError) return <ErrorState title="Không thể tải hồ sơ bé" message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} />;

  if (children.length === 1) {
    return <LoadingState label={`Đang mở tổng quan của ${children[0].displayName}`} />;
  }

  if (simulate) return <LegacyParentPreview query={legacyPreviewQuery} />;

  return <div className="parent-page parent-entry-page">
    <header className="workspace-page-heading">
      <div><p className="workspace-eyebrow">PHỤ HUYNH / TỔNG QUAN</p><h1>Chào {user.name?.split(" ").at(0) || "bạn"}, chọn một hành trình</h1><p>Mỗi bé có một không gian riêng để bố mẹ theo dõi, cài đặt và đồng hành mỗi ngày.</p></div>
      <Link className="workspace-button parent-entry-add-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm hồ sơ bé</Link>
    </header>
    {children.length ? <FamilyOverview profiles={children} userId={user.id} /> : <section className="parent-entry-empty"><EmptyState icon={Baby} title="Chưa có hồ sơ bé" message="Tạo hồ sơ đầu tiên để bắt đầu theo dõi hành trình riêng của bé." action={<Link className="workspace-button" to="/parent/children/new"><Plus size={17} aria-hidden="true" /> Thêm hồ sơ bé</Link>} /></section>}
  </div>;
}

function FamilyOverview({ profiles: children, userId }) {
  const dashboards = useQueries({ queries: children.map((child) => ({
    queryKey: queryKeys.childDashboard(userId, child.id, "7d"),
    queryFn: ({ signal }) => childrenService.dashboard({ childId: child.id, range: "7d", signal }),
  })) });
  const planQuery = useQuery({ queryKey: queryKeys.entitlement(userId), queryFn: ({ signal }) => childrenService.entitlement({ signal }) });
  const pendingIndex = dashboards.findIndex((query) => query.data?.pendingApprovals > 0);
  const featuredIndex = pendingIndex < 0 ? 0 : pendingIndex;
  const featuredChild = children[featuredIndex];
  const featured = dashboards[featuredIndex];
  const ready = dashboards.every((query) => query.isSuccess);
  const pending = dashboards.reduce((sum, query) => sum + (query.data?.pendingApprovals || 0), 0);
  const plan = planQuery.data;
  const percentage = plan?.childProfileLimit ? Math.min(100, Math.round(plan.usedChildProfiles / plan.childProfileLimit * 100)) : 0;
  return <>
    <section className="parent-entry-profiles" aria-labelledby="parent-entry-picker-title">
      <div className="parent-entry-section-label"><span>{children.length} hồ sơ</span></div>
      <div className="parent-entry-picker">
        <div className="parent-entry-picker-heading"><h2 id="parent-entry-picker-title">Hôm nay bố mẹ đồng hành cùng bé nào?</h2><span>Hoạt động trong 7 ngày gần đây</span></div>
        <div className="parent-entry-child-grid">{children.map((child, index) => <Link className="parent-entry-child" to={`/parent/children/${child.id}/dashboard`} key={child.id}>
          <img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="56" height="56" />
          <span className="parent-entry-child-name"><strong>{child.displayName}</strong><small>Mở tổng quan</small></span>
          <span className="parent-entry-metrics">{dashboards[index].isSuccess ? <><span className="parent-entry-metric"><Clock size={14} aria-hidden="true" />{dashboards[index].data.summary.readingMinutes} phút</span><span className="parent-entry-metric is-blue"><BookOpen size={14} aria-hidden="true" />{dashboards[index].data.summary.storiesCompleted} truyện</span></> : <small>{dashboards[index].isError ? "Chưa tải được hoạt động" : "Đang tải hoạt động…"}</small>}</span>
          <span className="parent-entry-arrow"><ArrowRight size={19} aria-hidden="true" /></span>
        </Link>)}</div>
        <p className="parent-entry-hint">Chọn một bé để xem chi tiết hành trình học tập</p>
      </div>
    </section>
    <section aria-labelledby="parent-entry-actions-title">
      <div className="parent-entry-section-label"><h2 id="parent-entry-actions-title">ĐỒNG HÀNH CÙNG GIA ĐÌNH</h2></div>
      <div className="parent-entry-actions">
        <article className="parent-entry-action is-attention">
          <span className="parent-entry-kicker">CẦN BỐ MẸ XEM</span><span className="parent-entry-action-icon"><Check size={19} aria-hidden="true" /></span>
          <h3>{ready ? (pending ? `${pending} yêu cầu đang chờ` : "Không có yêu cầu đang chờ") : "Yêu cầu của các bé"}</h3>
          <p>{pendingIndex >= 0 ? `${featuredChild.displayName} có nội dung cần bố mẹ xem và phê duyệt.` : ready ? "Bố mẹ đã xem hết các yêu cầu của bé." : "Mở hồ sơ để xem các nội dung cần phê duyệt."}</p>
          <Link to={`/parent/children/${featuredChild.id}/approvals`}>Xem yêu cầu <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
        <article className="parent-entry-action">
          <span className="parent-entry-kicker">ĐANG ÁP DỤNG</span><span className="parent-entry-action-icon"><GearSix size={19} aria-hidden="true" /></span>
          <h3>Cài đặt của {featuredChild.displayName}</h3>
          <p>{featured.isSuccess ? featured.data.settingsSummary.readingTimeLimitMinutes === null ? "Không giới hạn thời gian đọc mỗi ngày" : `${featured.data.settingsSummary.readingTimeLimitMinutes} phút đọc mỗi ngày` : "Quản lý thời gian đọc và chủ đề phù hợp cho bé."}</p>
          <Link to={`/parent/children/${featuredChild.id}/settings`}>Điều chỉnh cài đặt <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
        <article className="parent-entry-action is-plan">
          <span className="parent-entry-kicker">GÓI HIỆN TẠI</span>
          {planQuery.isError ? <><h3>Chưa tải được gói</h3><p>Vui lòng thử tải lại thông tin gói.</p><button type="button" onClick={() => planQuery.refetch()}>Thử lại</button></> : plan ? <><h3 className="parent-entry-plan-name">{plan.plan}<UsersThree size={22} aria-hidden="true" /></h3><p>{plan.childProfileLimit === null ? "Không giới hạn hồ sơ bé" : `Tối đa ${plan.childProfileLimit} hồ sơ bé`}</p><div className="parent-entry-quota"><span>{plan.usedChildProfiles}/{plan.childProfileLimit ?? "∞"} hồ sơ đã dùng</span>{plan.childProfileLimit !== null && <span>{percentage}%</span>}</div>{plan.childProfileLimit > 0 && <progress aria-label="Hạn mức hồ sơ đã dùng" max={plan.childProfileLimit} value={plan.usedChildProfiles} />}</> : <p role="status">Đang tải thông tin gói…</p>}
          <Link to="/parent/plan">Quản lý gói <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
      </div>
    </section>
  </>;
}

function LegacyParentPreview({ query }) {
  if (query.isLoading) return <LoadingState label="Đang tải tổng quan" />;
  if (query.isError) return <ErrorState title="Không thể tải tổng quan" message={query.error.message} onRetry={() => query.refetch()} />;
  const summary = query.data?.summary || {};
  return <div className="parent-page parent-legacy-preview"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">TƯƠNG THÍCH BẢN DEMO</p><h1>Nhịp đọc của gia đình</h1><p>Luồng mô phỏng cũ chỉ dùng để kiểm thử partial error; dashboard sản phẩm nằm trong từng hồ sơ bé.</p></div></div><div className="parent-dashboard-stat-grid workspace-stat-grid"><article className="workspace-stat-card"><span>Phút đọc</span><strong>{summary.readingMinutes || 0}</strong></article><article className="workspace-stat-card"><span>Truyện hoàn thành</span><strong>{summary.storiesCompleted || 0}</strong></article><article className="workspace-stat-card"><span>Từ đã ôn</span><strong>{summary.vocabularyReviewed || 0}</strong></article><article className="workspace-stat-card"><span>Chờ duyệt</span><strong>{summary.pendingApprovals || 0}</strong></article></div>{query.data?.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}</div>;
}
