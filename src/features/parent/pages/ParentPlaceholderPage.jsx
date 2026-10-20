import { ArrowRight, BookOpen, ChartLineUp, DownloadSimple, Gear, Package } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

const content = {
  "/parent/plan": { icon: Package, eyebrow: "GÓI SỬ DỤNG", title: "Gói và hạn mức", description: "Tìm hiểu quyền lợi và hạn mức dành cho gia đình." },
  "/parent/exports": { icon: DownloadSimple, eyebrow: "XUẤT TRUYỆN", title: "Các bản xuất của gia đình", description: "Tập hợp những câu chuyện gia đình đã lưu thành bản đọc riêng." },
  settings: { icon: Gear, eyebrow: "CÀI ĐẶT", title: "Cài đặt của bé", description: "Chọn thời gian đọc và chủ đề phù hợp với bé." },
  approvals: { icon: ChartLineUp, eyebrow: "PHÊ DUYỆT", title: "Nhân vật chờ duyệt", description: "Xem nội dung bé muốn đưa vào câu chuyện của mình." },
  library: { icon: BookOpen, eyebrow: "THƯ VIỆN", title: "Thư viện của bé", description: "Khám phá truyện và nhân vật dành riêng cho bé." },
  progress: { icon: ChartLineUp, eyebrow: "TIẾN ĐỘ", title: "Hành trình đọc", description: "Theo dõi những câu chuyện và hoạt động của bé." },
};

export default function ParentPlaceholderPage() {
  const location = useLocation();
  const key = Object.keys(content).find((candidate) => candidate === location.pathname || location.pathname.endsWith(candidate));
  const item = content[key] || content["/parent/plan"];
  const Icon = item.icon;
  return <div className="parent-page"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">{item.eyebrow}</p><h1>{item.title}</h1><p>{item.description}</p></div></div><section className="parent-roadmap-card"><span className="parent-roadmap-icon"><Icon size={30} aria-hidden="true" /></span><h2>Không gian gia đình</h2><p>Chọn hồ sơ bé để tiếp tục theo dõi hành trình đọc của gia đình.</p><Link to="/parent/children" className="parent-text-link">Quay về hồ sơ bé <ArrowRight size={17} aria-hidden="true" /></Link></section></div>;
}
