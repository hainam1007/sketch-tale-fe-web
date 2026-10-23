import { Link } from "react-router-dom";
import { BookOpen } from "@phosphor-icons/react";
import "../parent-overview.css";

const features = {
  dashboard: [
    "Tổng quan hoạt động",
    "Theo dõi thời gian đọc và những truyện bé đã hoàn thành.",
    ["Thời gian đọc", "Truyện hoàn thành", "Hoạt động gần đây"],
  ],
  progress: [
    "Tiến độ học tập",
    "Cùng bé nhìn lại những bước tiến qua từng tuần.",
    ["Thói quen đọc", "Từ vựng đã ôn", "Kết quả câu hỏi"],
  ],
  approvals: [
    "Yêu cầu cần bố mẹ duyệt",
    "Xem nhân vật và quyền sử dụng trước khi bé tiếp tục sáng tạo.",
    ["Chờ duyệt", "Đã đồng ý", "Đã từ chối"],
  ],
  library: [
    "Thư viện của bé",
    "Tập hợp truyện và nhân vật của riêng bé.",
    ["Truyện của bé", "Nhân vật", "Yêu thích"],
  ],
  exports: [
    "Bản xuất truyện",
    "Lưu lại tác phẩm của bé để đọc và chia sẻ cùng gia đình.",
    ["Đang xử lý", "Sẵn sàng tải", "Lịch sử bản xuất"],
  ],
  reports: [
    "Báo cáo học tập của gia đình",
    "Nhìn lại hành trình đọc của các bé trong một báo cáo dễ theo dõi.",
    ["Tổng hợp theo tháng", "Tiến độ từng bé", "Báo cáo qua email"],
  ],
};

export default function ParentFeaturePending({
  feature = "dashboard",
  childId,
}) {
  const [title, description, sections] =
    features[feature] || features.dashboard;
  return (
    <section className="parent-page parent-entry-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">ĐỒNG HÀNH CÙNG BÉ</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="parent-pending-panel">
        <span className="parent-pending-label">Sắp ra mắt</span>
        <h2>Không gian này đang được chuẩn bị</h2>
        <p>
          Chưa có dữ liệu để hiển thị. Bạn vẫn có thể quản lý hồ sơ và chọn
          truyện để đọc cùng bé.
        </p>
        <ul className="parent-pending-list">
          {sections.map((label) => (
            <li key={label}>
              <BookOpen size={19} aria-hidden="true" />
              <span>{label}</span>
              <span>Chưa khả dụng</span>
            </li>
          ))}
        </ul>
        <div className="parent-form-actions">
          <Link
            className="workspace-button workspace-button-quiet"
            to={
              childId
                ? `/parent/children/${encodeURIComponent(childId)}`
                : "/parent/children"
            }
          >
            Về hồ sơ bé
          </Link>
          <Link className="workspace-button" to="/parent/library">
            Khám phá truyện
          </Link>
        </div>
      </div>
    </section>
  );
}
