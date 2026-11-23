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

export default function FamilyProfilesLive({ showAddAction = false }) {
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
      <div className="family-profile-grid family-child-profile-grid">
        {query.data.map((profile, index) => (
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
