import { Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import FamilyProfilesPreview, { showFamilyProfilePreview } from "../components/FamilyProfilesPreview";
import "../parent-overview.css";

export default function ParentOverviewPage() {
  const { user } = useAuth();
  const firstName = user.name?.trim().split(/\s+/).at(-1) || "bạn";

  return (
    <div className="parent-page parent-entry-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / TỔNG QUAN</p>
          <h1>Chào {firstName}, cùng bé bắt đầu hành trình đọc nhé</h1>
          <p>Tạo không gian riêng cho từng bé để gia đình đồng hành mỗi ngày.</p>
        </div>
        <Link className="workspace-button parent-entry-add-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm tài khoản bé</Link>
      </header>
      {showFamilyProfilePreview
        ? <FamilyProfilesPreview overview />
        : <FamilyProfilesStatus showCreate={false} />}
    </div>
  );
}
