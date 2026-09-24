import { Baby, Plus, UsersThree } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { childrenService } from "../services/childrenService";
import { queryKeys } from "../../../lib/api/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "../../../components/feedback/States";

export default function ChildrenPage() {
  const { user } = useAuth();
  const childrenQuery = useQuery({ queryKey: queryKeys.children(user.id), queryFn: () => childrenService.list() });
  const entitlementQuery = useQuery({ queryKey: queryKeys.entitlement(user.id), queryFn: () => childrenService.entitlement() });

  if (childrenQuery.isLoading || entitlementQuery.isLoading) return <LoadingState label="Đang tải hồ sơ gia đình" />;
  if (childrenQuery.isError) return <ErrorState message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} />;
  if (entitlementQuery.isError) return <ErrorState title="Chưa thể tải hạn mức" message={entitlementQuery.error.message} onRetry={() => entitlementQuery.refetch()} />;

  const { items } = childrenQuery.data;
  const entitlement = entitlementQuery.data;
  const atLimit = entitlement.childProfileLimit !== null && items.length >= entitlement.childProfileLimit;

  return (
    <div className="parent-page">
      <div className="workspace-page-heading"><div><p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p><h1>Hồ sơ bé</h1><p>Mỗi hồ sơ có một không gian riêng để câu chuyện và tiến độ không bị trộn lẫn.</p></div><Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm hồ sơ bé</Link></div>
      <div className="parent-quota-strip"><div><span className="parent-panel-kicker">HẠN MỨC GÓI {entitlement.plan.toUpperCase()}</span><strong>{items.length} / {entitlement.childProfileLimit ?? "∞"} hồ sơ đang dùng</strong></div>{atLimit && <span className="parent-quota-warning">Bạn đã dùng hết hạn mức</span>}</div>
      {items.length ? <div className="children-list" aria-label="Danh sách hồ sơ bé">{items.map((child) => <ChildListItem child={child} key={child.id} />)}</div> : <EmptyState icon={Baby} title="Gia đình chưa có hồ sơ bé" message="Tạo hồ sơ đầu tiên để bắt đầu hành trình đọc cùng bé." action={<Link className="workspace-button" to="/parent/children/new"><Plus size={17} aria-hidden="true" /> Tạo hồ sơ bé</Link>} />}
      {!atLimit && items.length > 0 && <Link className="parent-add-another" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm một hồ sơ khác</Link>}
      {atLimit && <p className="parent-help-note"><UsersThree size={17} aria-hidden="true" /> Hạn mức được trả về từ máy chủ demo theo gói hiện tại, không tính từ bảng giá trên giao diện.</p>}
    </div>
  );
}

function ChildListItem({ child }) {
  return <article className="child-list-item"><img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="75" height="75" /><div className="child-list-copy"><span className="parent-panel-kicker">HỒ SƠ BÉ</span><h2>{child.displayName}</h2><p>Ngày sinh {new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(`${child.birthDate}T00:00:00`))}</p></div><Link className="workspace-button workspace-button-quiet" to={`/parent/children/${child.id}`}>Mở hồ sơ <span className="sr-only">{child.displayName}</span></Link></article>;
}
