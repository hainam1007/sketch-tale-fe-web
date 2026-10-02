import { ArrowRight, Baby, Plus, UsersThree } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";

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
    <div className="workspace-page-heading">
      <div><p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p><h1>Chào {user.name?.split(" ").at(0) || "bạn"}, chọn một hành trình</h1><p>Mỗi bé có một dashboard riêng để dữ liệu, cài đặt và những việc cần xem luôn rõ ràng.</p></div>
      <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm hồ sơ bé hoặc liên kết</Link>
    </div>
    {children.length ? <section className="parent-entry-picker" aria-labelledby="parent-entry-picker-title"><div className="parent-entry-picker-heading"><div><span className="parent-panel-kicker">HỒ SƠ ĐÃ LIÊN KẾT</span><h2 id="parent-entry-picker-title">Ai đang kể chuyện hôm nay?</h2></div><span>{children.length} hồ sơ</span></div><div className="parent-entry-child-grid">{children.map((child) => <Link className="parent-entry-child" to={`/parent/children/${child.id}/dashboard`} key={child.id}><img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="68" height="68" /><span><strong>{child.displayName}</strong><small>Mở dashboard riêng</small></span><ArrowRight size={19} aria-hidden="true" /></Link>)}</div></section> : <section className="parent-entry-empty"><EmptyState icon={children.length ? UsersThree : Baby} title="Chưa có hồ sơ bé" message="Kết nối tài khoản Child để bắt đầu theo dõi hành trình riêng của bé." action={<Link className="workspace-button" to="/parent/children/new"><Plus size={17} aria-hidden="true" /> Mời hoặc liên kết bé</Link>} /></section>}
  </div>;
}

function LegacyParentPreview({ query }) {
  if (query.isLoading) return <LoadingState label="Đang tải tổng quan" />;
  if (query.isError) return <ErrorState title="Không thể tải tổng quan" message={query.error.message} onRetry={() => query.refetch()} />;
  const summary = query.data?.summary || {};
  return <div className="parent-page parent-legacy-preview"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">TƯƠNG THÍCH BẢN DEMO</p><h1>Nhịp đọc của gia đình</h1><p>Luồng mô phỏng cũ chỉ dùng để kiểm thử partial error; dashboard sản phẩm nằm trong từng hồ sơ bé.</p></div></div><div className="parent-dashboard-stat-grid workspace-stat-grid"><article className="workspace-stat-card"><span>Phút đọc</span><strong>{summary.readingMinutes || 0}</strong></article><article className="workspace-stat-card"><span>Truyện hoàn thành</span><strong>{summary.storiesCompleted || 0}</strong></article><article className="workspace-stat-card"><span>Từ đã ôn</span><strong>{summary.vocabularyReviewed || 0}</strong></article><article className="workspace-stat-card"><span>Chờ duyệt</span><strong>{summary.pendingApprovals || 0}</strong></article></div>{query.data?.errors?.map((error) => <div className="dashboard-partial-warning" role="status" key={error.section}><strong>Dữ liệu chưa đầy đủ</strong><span>{error.message}</span></div>)}</div>;
}
