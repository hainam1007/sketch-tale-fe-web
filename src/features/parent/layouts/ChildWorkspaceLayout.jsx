import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { childrenService } from "../services/childrenService";
import { useAuth } from "../../auth/AuthProvider";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, ForbiddenState, LoadingState } from "../../../components/feedback/States";

const tabs = [
  { suffix: "", label: "Hồ sơ" },
  { suffix: "/settings", label: "Cài đặt" },
  { suffix: "/approvals", label: "Phê duyệt" },
  { suffix: "/library", label: "Thư viện" },
  { suffix: "/progress", label: "Tiến độ" },
];

export default function ChildWorkspaceLayout() {
  const { user } = useAuth();
  const { childId } = useParams();
  const location = useLocation();
  const childrenQuery = useQuery({
    queryKey: queryKeys.children(user.id),
    queryFn: ({ signal }) => childrenService.list({ signal }),
  });
  const childQuery = useQuery({
    queryKey: queryKeys.child(user.id, childId),
    queryFn: ({ signal }) => childrenService.get({ childId, signal }),
  });

  if (childrenQuery.isLoading || childQuery.isLoading) return <LoadingState label="Đang mở hồ sơ bé" />;
  if (childrenQuery.isError) return <ErrorState message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} />;
  if (childQuery.isError) {
    if (childQuery.error.status === 403) return <ForbiddenState message={childQuery.error.message} />;
    return <ErrorState title="Không tìm thấy hồ sơ" message="Đường dẫn này không còn trỏ tới một hồ sơ bé hợp lệ." />;
  }

  const child = childQuery.data;
  const currentPath = `/parent/children/${childId}`;

  return (
    <section className="child-workspace">
      <div className="child-workspace-topline"><Link to="/parent/children">← Quay lại danh sách bé</Link></div>
      <div className="child-heading">
        <div className="child-heading-person">
          <img src={child.avatar === "rabbit" ? "/images/rabbit.webp" : "/images/seed.webp"} alt="" width="64" height="64" />
          <div><p className="workspace-eyebrow">HỒ SƠ ĐANG CHỌN</p><h1>{child.displayName}</h1><span>Ngày sinh {formatBirthDate(child.birthDate)}</span></div>
        </div>
        <label className="child-selector">
          <span className="sr-only">Chọn hồ sơ bé</span>
          <select value={child.id} onChange={(event) => { window.location.href = `${currentPath.replace(childId, event.target.value)}${getTabSuffix(location.pathname, currentPath)}`; }}>
            {childrenQuery.data.items.map((item) => <option value={item.id} key={item.id}>{item.displayName}</option>)}
          </select>
          <CaretDown size={16} aria-hidden="true" />
        </label>
      </div>
      <nav className="child-tabs" aria-label={`Khu vực của ${child.displayName}`}>
        {tabs.map((tab) => <NavLink key={tab.suffix} to={`${currentPath}${tab.suffix}`} end={!tab.suffix}>{tab.label}</NavLink>)}
      </nav>
      <Outlet context={{ child, children: childrenQuery.data.items }} />
    </section>
  );
}

function formatBirthDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function getTabSuffix(pathname, base) {
  return pathname.startsWith(base) ? pathname.slice(base.length) : "";
}
