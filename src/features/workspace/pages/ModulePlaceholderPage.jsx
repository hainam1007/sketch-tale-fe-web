import { ArrowLeft, Wrench } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

export default function ModulePlaceholderPage() {
  const location = useLocation();
  const home = location.pathname.startsWith("/admin") ? "/admin" : "/content";
  return <div className="workspace-dashboard"><div className="workspace-page-heading"><div><p className="workspace-eyebrow">MODULE ĐANG XÂY DỰNG</p><h1>{formatPath(location.pathname)}</h1><p>Route và quyền đã được nối. UI nghiệp vụ tiếp theo sẽ bám theo contract tương ứng trong kế hoạch triển khai.</p></div></div><section className="workspace-placeholder"><Wrench size={31} aria-hidden="true" /><h2>Đã chừa chỗ trong kiến trúc</h2><p>Đây là điểm nối cho milestone tiếp theo. Không có dữ liệu giả được hiển thị như dữ liệu thật.</p><Link className="workspace-button workspace-button-quiet" to={home}><ArrowLeft size={17} aria-hidden="true" /> Về tổng quan</Link></section></div>;
}

function formatPath(pathname) {
  const value = pathname.split("/").filter(Boolean).at(-1) || "workspace";
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
