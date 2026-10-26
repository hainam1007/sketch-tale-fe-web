import { Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import FamilyProfilesLive from "../components/FamilyProfilesLive";
import { moduleApiModes } from "../../../lib/api/featureApi";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import FamilyProfilesPreview from "../components/FamilyProfilesPreview";
import { showFamilyProfilePreview } from "../services/familyProfilePreview";
import "../parent-overview.css";

export default function ChildrenPage() {
  return (
    <div className="parent-page parent-entry-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p>
          <h1>Hồ sơ bé</h1>
          <p>Một không gian riêng cho mỗi bé và hành trình đọc của gia đình.</p>
        </div>
        <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm tài khoản bé</Link>
      </div>
      {moduleApiModes.parentProfile === "real" ? <FamilyProfilesLive /> : showFamilyProfilePreview
        ? <FamilyProfilesPreview />
        : <FamilyProfilesStatus showCreate={false} />}
    </div>
  );
}
