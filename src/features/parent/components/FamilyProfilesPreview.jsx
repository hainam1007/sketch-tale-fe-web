import { ArrowClockwise, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { previewProfiles } from "../services/familyProfilePreview";
import {
  FamilyAddProfileCard,
  FamilyProfileCard,
} from "./FamilyProfileCard";
import "../parent-experience.css";

export default function FamilyProfilesPreview({ showAddAction = false }) {
  const { user } = useAuth();

  return (
    <section className="family-picker" aria-labelledby="family-profiles-heading">
      <div className="family-section-heading">
        <div>
          <h2 id="family-profiles-heading">Hồ sơ bé</h2>
          <p>{previewProfiles.length} hồ sơ</p>
        </div>
        <div className="family-section-controls">
          <button
            className="family-refresh"
            type="button"
            aria-label="Làm mới trang"
            onClick={() => window.location.reload()}
          >
            <ArrowClockwise size={19} aria-hidden="true" /> Làm mới
          </button>
          {showAddAction && <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm tài khoản bé</Link>}
        </div>
      </div>
      <div className="family-profile-grid family-child-profile-grid">
        {previewProfiles.map((profile, index) => (
          <FamilyProfileCard
            profile={profile}
            index={index}
            userId={user.id}
            key={profile.id}
          />
        ))}
        <FamilyAddProfileCard />
      </div>
    </section>
  );
}
