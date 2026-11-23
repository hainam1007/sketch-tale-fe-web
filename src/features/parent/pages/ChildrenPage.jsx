import FamilyProfilesLive from "../components/FamilyProfilesLive";
import { moduleApiModes } from "../../../lib/api/featureApi";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import FamilyProfilesPreview from "../components/FamilyProfilesPreview";
import { showFamilyProfilePreview } from "../services/familyProfilePreview";
import "../parent-overview.css";

export default function ChildrenPage() {
  return (
    <div className="parent-page parent-entry-page parent-children-page">
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / HỒ SƠ BÉ</p>
        </div>
      </div>
      {moduleApiModes.parentProfile === "real" ? <FamilyProfilesLive showAddAction /> : showFamilyProfilePreview
        ? <FamilyProfilesPreview showAddAction />
        : <FamilyProfilesStatus showCreate />}
    </div>
  );
}
