import { ArrowClockwise, Plus, Clock, Carrot, Rabbit } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { parentProfileService } from "../services/parentProfileService";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import ChildAvatar from "./ChildAvatar";
import { savedAvatar } from "../services/profilePresentation";
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
            className="family-profile-card family-artist-card"
            key={child.id}
            to={`/parent/children/${encodeURIComponent(child.id)}`}
            aria-label={`Mở không gian của ${child.nickName || "bé"}`}
          >
            <img className="family-palette-art" src="/images/library/child-palette.webp" alt="" width="768" height="768" />
            <div className="family-palette-portrait" aria-hidden="true">
              <ChildAvatar id={child.id} index={savedAvatar(user.id, child.id, index)} size={90} />
            </div>
            <h3
              className="family-artist-name-tag"
              title={child.nickName || "Bé của bạn"}
            >
              <span>{child.nickName || "Bé của bạn"}</span>
              <span className="family-artist-name-sticker" aria-hidden="true">
                {index % 2 === 0 ? (
                  <Carrot size={19} weight="duotone" />
                ) : (
                  <Rabbit size={19} weight="duotone" />
                )}
              </span>
            </h3>
            <span className="family-time family-artist-time-tag">
              <Clock size={14} aria-hidden="true" />
              {child.dailyTimeLimit == null
                ? "Thiết lập giờ đọc"
                : `${child.dailyTimeLimit} phút/ngày`}
            </span>
          </Link>
        ))}
        <Link className="family-add-card family-artist-add" to="/parent/children/new">
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
