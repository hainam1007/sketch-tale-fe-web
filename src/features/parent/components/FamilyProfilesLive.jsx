import { ArrowClockwise, Plus } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { parentProfileService } from "../services/parentProfileService";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import {
  FamilyAddProfileCard,
  FamilyProfileCard,
} from "./FamilyProfileCard";
import "../parent-experience.css";

export default function FamilyProfilesLive({ showAddAction = false, showMascot = showAddAction }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["parent-live-profiles-v2", user.id],
    queryFn: ({ signal }) => parentProfileService.list({ user, signal }),
  });

  if (query.isPending) return <LoadingState label="Đang tải hồ sơ gia đình" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Chưa tải được hồ sơ bé"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const displayMascot = showMascot && query.data.length === 1;

  return (
    <section className="family-picker" aria-labelledby="family-live-title">
      <div className="family-section-heading">
        <div>
          <h2 id="family-live-title">Hồ sơ bé</h2>
          <p>{query.data.length} hồ sơ</p>
        </div>
        <div className="family-section-controls">
          <button
            className="family-refresh"
            type="button"
            aria-label="Làm mới hồ sơ"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <ArrowClockwise size={19} aria-hidden="true" /> Làm mới
          </button>
          {showAddAction && <Link className="workspace-button" to="/parent/children/new"><Plus size={18} aria-hidden="true" /> Thêm tài khoản bé</Link>}
        </div>
      </div>
      <div className={`family-profile-grid family-child-profile-grid${displayMascot ? " has-mascot" : ""}`}>
        {query.data.map((profile, index) => (
          <FamilyProfileCard
            profile={profile}
            index={index}
            userId={user.id}
            key={profile.id}
          />
        ))}
        <FamilyAddProfileCard />
        {displayMascot && (
          <>
            <svg className="family-profile-trail" viewBox="0 0 360 95" fill="none" aria-hidden="true" preserveAspectRatio="none">
              <path d="M3 68C69 15 105 15 157 51S260 89 354 24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 8" strokeLinecap="round" />
              <path d="m78 16 2.5 5.5 6 .7-4.5 4 1.2 6-5.2-3-5.2 3 1.2-6-4.5-4 6-.7L78 16Z" fill="currentColor" />
              <path d="M211 67c7-4 14-4 21 0v15c-7-4-14-4-21 0V67Zm21 0c7-4 14-4 21 0v15c-7-4-14-4-21 0V67Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m309 36 13-15 5 5-13 15-8 3 3-8Zm13-15 2-2 5 5-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <aside className="family-mascot-note">
              <div className="family-mascot-art" aria-hidden="true">
                <img src="/images/SketchTale_Mascot_Loading.webp" alt="" />
                <span className="family-mascot-books"><i /><i /><i /></span>
              </div>
              <p>“Mỗi bạn nhỏ đều có một câu chuyện riêng!”</p>
            </aside>
          </>
        )}
      </div>
    </section>
  );
}
