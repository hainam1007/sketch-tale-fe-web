import { Baby, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function FamilyProfilesStatus({
  title = "Danh sách hồ sơ bé đang được cập nhật",
  message = "Tài khoản cho bé vẫn có thể tạo và sử dụng. Các hồ sơ gia đình sẽ được hiển thị tại đây để bố mẹ tiện theo dõi.",
  showCreate = true,
}) {
  return (
    <section className="parent-family-status" aria-labelledby="parent-family-status-title">
      <span className="parent-family-status-icon" aria-hidden="true"><Baby size={27} /></span>
      <div className="parent-family-status-copy">
        <p className="workspace-eyebrow">KHÔNG GIAN GIA ĐÌNH</p>
        <h2 id="parent-family-status-title">{title}</h2>
        <p>{message}</p>
      </div>
      {showCreate && <Link className="workspace-button" to="/parent/children/new"><Plus size={17} aria-hidden="true" /> Thêm tài khoản bé</Link>}
    </section>
  );
}
