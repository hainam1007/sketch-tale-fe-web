import { ArrowRight, ArrowClockwise, Plus, Clock } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { parentProfileService } from "../services/parentProfileService";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import ChildAvatar from "./ChildAvatar";
import { ageLabel, savedAvatar } from "../services/profilePresentation";
import "../parent-experience.css";
export default function FamilyProfilesLive() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["parent-live-profiles", user.id],
    queryFn: parentProfileService.list,
  });
  if (query.isPending) return <LoadingState label="Đang tải hồ sơ gia đình" />;
  if (query.isError)
    return (
      <ErrorState
        title="Chưa tải được hồ sơ bé"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  return (
    <section className="family-picker" aria-labelledby="family-live-title">
      <div className="family-section-heading">
        <div>
          <p className="workspace-eyebrow">MỖI BÉ, MỘT HÀNH TRÌNH</p>
          <h2 id="family-live-title">Hôm nay, mình đồng hành cùng ai?</h2>
          <p>{query.data.length} hồ sơ trong gia đình</p>
        </div>
        <button
          className="family-refresh"
          aria-label="Làm mới hồ sơ"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <ArrowClockwise size={19} /> Làm mới
        </button>
      </div>
      <div className="family-profile-grid">
        {query.data.map((child, index) => (
          <Link
            className="family-profile-card"
            key={child.id}
            to={`/parent/children/${encodeURIComponent(child.id)}`}
          >
            <ChildAvatar id={child.id} index={savedAvatar(user.id, child.id, index)} size={42} />
            <h3>{child.nickName || "Bé của bạn"}</h3>
            <p>{ageLabel(child.targetAgeGroup)}</p>
            <span className="family-time">
              <Clock size={16} />
              {child.dailyTimeLimit == null
                ? "Thiết lập giờ đọc"
                : `${child.dailyTimeLimit} phút/ngày`}
            </span>
            <span className="family-card-action">
              Mở không gian của bé <ArrowRight size={18} />
            </span>
          </Link>
        ))}
        <Link className="family-add-card" to="/parent/children/new">
          <span>
            <Plus size={28} />
          </span>
          <strong>Thêm một bạn nhỏ</strong>
          <p>
            Tạo không gian đọc riêng
            <br />
            cho thành viên mới
          </p>
        </Link>
      </div>
    </section>
  );
}
