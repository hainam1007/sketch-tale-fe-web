import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthProvider";
import { parentProfileService } from "../services/parentProfileService";
import { savedAvatar } from "../services/profilePresentation";
import ChildAvatar from "../components/ChildAvatar";
import { ErrorState, LoadingState } from "../../../components/feedback/States";
import "../parent-experience.css";
export default function FamilyReportsDemo({ exports: showExports = false }) {
  const { user } = useAuth();
  const family = useQuery({
    queryKey: ["parent-live-profiles", user.id],
    queryFn: parentProfileService.list,
  });
  return (
    <div className="parent-page family-workspace">
      <header>
        <p className="workspace-eyebrow">GÓC ĐỒNG HÀNH</p>
        <h1>
          {showExports
            ? "Những câu chuyện muốn giữ lại"
            : "Mỗi bé có một nhịp lớn lên riêng"}
        </h1>
        <p>
          Chọn bé để{" "}
          {showExports
            ? "tạo và quản lý bản xuất truyện"
            : "xem báo cáo, thói quen đọc và gợi ý đồng hành"}
          .
        </p>
      </header>
      {family.isPending ? (
        <LoadingState />
      ) : family.isError ? (
        <ErrorState
          message={family.error.message}
          onRetry={() => family.refetch()}
        />
      ) : (
        <div className="family-profile-grid">
          {family.data.map((child, index) => (
            <Link
              className="family-profile-card"
              key={child.id}
              to={`/parent/children/${encodeURIComponent(child.id)}/${showExports ? "exports" : "progress"}`}
            >
              <ChildAvatar index={savedAvatar(user.id, child.id, index)} size={40} />
              <h2>{child.nickName}</h2>
              <p>
                {showExports
                  ? "Tạo bản xuất và xem lịch sử"
                  : "Thời gian đọc · Từ vựng · Kết quả câu hỏi"}
              </p>
              <span className="family-card-action">
                {showExports ? "Mở bản xuất" : "Xem báo cáo"} →
              </span>
            </Link>
          ))}
        </div>
      )}
      {family.isSuccess && !family.data.length && (
        <Link className="workspace-button" to="/parent/children/new">
          Tạo hồ sơ đầu tiên
        </Link>
      )}
    </div>
  );
}
