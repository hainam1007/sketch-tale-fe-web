import { ArrowRight, BookOpen, ChartLineUp, DownloadSimple, Gear, Package } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

const content = {
  "/parent/plan": { icon: Package, eyebrow: "GÓI SỬ DỤNG", title: "Gói và hạn mức", description: "Màn hình này sẽ đọc entitlement, ngày reset và quyền truy cập nội dung từ API." },
  "/parent/exports": { icon: DownloadSimple, eyebrow: "XUẤT TRUYỆN", title: "Các bản xuất của gia đình", description: "Theo dõi export job và tải file sẽ được bổ sung khi contract export với Backend được chốt." },
  settings: { icon: Gear, eyebrow: "CÀI ĐẶT", title: "Cài đặt của bé", description: "Khu vực cài đặt thời gian đọc và category được phép sẽ kết nối ở milestone M2." },
  approvals: { icon: ChartLineUp, eyebrow: "PHÊ DUYỆT", title: "Nhân vật chờ duyệt", description: "Luồng xem phiên bản, duyệt/reject và quyền vai nhạy cảm sẽ được triển khai ở M2." },
  library: { icon: BookOpen, eyebrow: "THƯ VIỆN", title: "Thư viện của bé", description: "Truyện và nhân vật theo từng hồ sơ sẽ được triển khai ở M3." },
  progress: { icon: ChartLineUp, eyebrow: "TIẾN ĐỘ", title: "Hành trình đọc", description: "Reading, vocabulary và quiz theo khoảng thời gian sẽ được triển khai ở M5." },
};

export default function ParentPlaceholderPage() {
  const location = useLocation();
  const key = Object.keys(content).find((candidate) => candidate === location.pathname || location.pathname.endsWith(candidate));
  const item = content[key] || content["/parent/plan"];
  const Icon = item.icon;
  return <div className="parent-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">{item.eyebrow}</p><h1>{item.title}</h1><p>{item.description}</p></div></div><section className="parent-roadmap-card"><span className="parent-roadmap-icon"><Icon size={30} aria-hidden="true" /></span><h2>Đã có chỗ trong workspace</h2><p>Shell, route và quyền truy cập đã sẵn sàng. Dữ liệu nghiệp vụ của màn hình này sẽ được nối tiếp theo contract tương ứng.</p><Link to="/parent/children" className="parent-text-link">Quay về hồ sơ bé <ArrowRight size={17} aria-hidden="true" /></Link></section></div>;
}
