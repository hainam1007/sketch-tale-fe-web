import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpen, CaretDown, Clock } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useConfirmToast } from "../../../components/feedback/useConfirmToast";
import { childrenService } from "../services/childrenService";
import { useAuth } from "../../auth/useAuth";
import { queryKeys } from "../../../lib/api/queryKeys";
import { ErrorState, ForbiddenState, LoadingState } from "../../../components/feedback/States";
import { getFamilyProfilePreview } from "../services/familyProfilePreview";

const tabs = [
  { suffix: "/dashboard", label: "Tổng quan" },
  { suffix: "", label: "Hồ sơ" },
  { suffix: "/settings", label: "Cài đặt" },
  { suffix: "/approvals", label: "Phê duyệt" },
  { suffix: "/library", label: "Thư viện" },
  { suffix: "/progress", label: "Tiến độ" },
  { suffix: "/exports", label: "Bản xuất" },
];

export default function ChildWorkspaceLayout() {
  const { childId } = useParams();
  const previewChild = getFamilyProfilePreview(childId);

  if (previewChild) return <FamilyPreviewWorkspace child={previewChild} />;
  return <LinkedChildWorkspaceLayout />;
}

function FamilyPreviewWorkspace({ child }) {
  return (
    <section className="child-workspace">
      <div className="child-workspace-topline"><Link to="/parent/children">← Quay lại hồ sơ bé</Link></div>
      <div className="child-heading">
        <div className="child-heading-person">
          <img src={child.avatar} alt="" width="64" height="64" />
          <div><p className="workspace-eyebrow">HỒ SƠ BÉ</p><h1>{child.name}</h1><span>{child.age}</span></div>
        </div>
      </div>
      <section className="parent-preview-detail" aria-labelledby="parent-preview-detail-title">
        <div className="parent-preview-detail-card">
          <div className="parent-preview-detail-heading">
            <p className="workspace-eyebrow">HÀNH TRÌNH ĐỌC</p>
            <h2 id="parent-preview-detail-title">Hoạt động trong tuần này</h2>
            <p>{child.name} gần đây đã đọc <strong>{child.recentStory}</strong>.</p>
          </div>
          <div className="parent-preview-detail-stats">
            <article><span>Thời gian đọc</span><strong><Clock size={18} aria-hidden="true" />{child.readingMinutes} phút</strong></article>
            <article><span>Truyện đã đọc</span><strong><BookOpen size={18} aria-hidden="true" />{child.storiesCompleted} truyện</strong></article>
          </div>
        </div>
      </section>
    </section>
  );
}

function LinkedChildWorkspaceLayout() {
  const { user } = useAuth();
  const { childId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const confirmToast = useConfirmToast();
  const tabsRef = useRef(null);
  const [childFormDirty, setChildFormDirty] = useState(false);
  const childrenQuery = useQuery({
    queryKey: queryKeys.children(user.id),
    queryFn: ({ signal }) => childrenService.list({ signal }),
  });
  const childQuery = useQuery({
    queryKey: queryKeys.child(user.id, childId),
    queryFn: ({ signal }) => childrenService.get({ childId, signal }),
  });

  useEffect(() => {
    const tabsElement = tabsRef.current;
    const activeTab = tabsElement?.querySelector("a.active");
    if (!tabsElement || !activeTab) return;
    const targetLeft = activeTab.offsetLeft - Math.max(0, (tabsElement.clientWidth - activeTab.offsetWidth) / 2);
    tabsElement.scrollLeft = Math.max(0, Math.min(targetLeft, tabsElement.scrollWidth - tabsElement.clientWidth));
  }, [location.pathname, childQuery.data?.id]);

  if (childrenQuery.isLoading || childQuery.isLoading) return <LoadingState label="Đang mở hồ sơ bé" />;
  if (childrenQuery.isError) return <ErrorState message={childrenQuery.error.message} onRetry={() => childrenQuery.refetch()} />;
  if (childQuery.isError) {
    if (childQuery.error.status === 403) return <ForbiddenState message={childQuery.error.message} />;
    return <ErrorState title="Không tìm thấy hồ sơ" message="Đường dẫn này không còn trỏ tới một hồ sơ bé hợp lệ." />;
  }

  const child = childQuery.data;
  const linkedChildren = childrenQuery.data.items.filter((item) => !item.linkStatus || item.linkStatus === "active");
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
          <select aria-label="Đang xem hồ sơ bé" value={child.id} onChange={async (event) => {
            const nextChildId = event.target.value;
            if (childFormDirty) {
              event.target.value = child.id;
              if (!await confirmToast({ title: "Đổi hồ sơ bé?", message: "Hồ sơ hiện tại có thay đổi chưa lưu. Nếu tiếp tục, các thay đổi này sẽ bị bỏ.", confirmLabel: "Đổi hồ sơ", tone: "danger" })) return;
            }
            setChildFormDirty(false);
            navigate(`/parent/children/${nextChildId}${getTabSuffix(location.pathname, currentPath)}`);
          }}>
            {linkedChildren.map((item) => <option value={item.id} key={item.id}>{item.displayName}</option>)}
          </select>
          <CaretDown size={16} aria-hidden="true" />
        </label>
      </div>
      <nav ref={tabsRef} className="child-tabs" aria-label={`Khu vực của ${child.displayName}`}>
        {tabs.map((tab) => <NavLink key={tab.suffix} to={`${currentPath}${tab.suffix}`} end={!tab.suffix}>{tab.label}</NavLink>)}
      </nav>
      <Outlet context={{ child, children: childrenQuery.data.items, setChildFormDirty }} />
    </section>
  );
}

function formatBirthDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function getTabSuffix(pathname, base) {
  return pathname.startsWith(base) ? pathname.slice(base.length) : "";
}
