import { ArrowClockwise } from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import { previewProfiles } from "../services/familyProfilePreview";
import {
  FamilyAddProfileCard,
  FamilyProfileCard,
} from "./FamilyProfileCard";
import "../parent-experience.css";

export default function FamilyProfilesPreview() {
  const { user } = useAuth();

  return (
    <section className="family-picker" aria-labelledby="family-profiles-heading">
      <div className="family-section-heading">
        <div>
          <h2 id="family-profiles-heading">Hôm nay, mình đồng hành cùng ai?</h2>
          <p>{previewProfiles.length} hồ sơ trong gia đình</p>
        </div>
        <button
          className="family-refresh"
          type="button"
          aria-label="Làm mới trang"
          onClick={() => window.location.reload()}
        >
          <ArrowClockwise size={19} aria-hidden="true" /> Làm mới
        </button>
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
