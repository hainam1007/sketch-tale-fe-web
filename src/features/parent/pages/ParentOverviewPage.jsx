import { BookOpen, ChartBar, Package, ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import FamilyProfilesLive from "../components/FamilyProfilesLive";
import { moduleApiModes } from "../../../lib/api/featureApi";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import FamilyProfilesPreview from "../components/FamilyProfilesPreview";
import { showFamilyProfilePreview } from "../services/familyProfilePreview";
import "../parent-overview.css";

export default function ParentOverviewPage() {
  const { user } = useAuth();
  const firstName = user.name?.trim().split(/\s+/).at(-1) || "bạn";

  return (
    <div className="parent-page parent-entry-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / TỔNG QUAN</p>
          <h1>Chào {firstName}, hôm nay cùng bé khám phá nhé!</h1>
        </div>
      </header>
      {moduleApiModes.parentProfile === "real" ? (
        <FamilyProfilesLive showAddAction showMascot />
      ) : showFamilyProfilePreview ? (
        <FamilyProfilesPreview overview showAddAction />
      ) : (
        <FamilyProfilesStatus showCreate />
      )}
      <nav
        className="family-action-grid family-home-actions"
        aria-label="Lối tắt cho phụ huynh"
      >
        <Link to="/parent/library">
          <BookOpen size={28} weight="duotone" />
          <strong>Mở một câu chuyện</strong>
          <span>Chọn điều bé muốn khám phá hôm nay</span>
          <ArrowRight size={20} />
        </Link>
        <Link to="/parent/children">
          <ChartBar size={28} weight="duotone" />
          <strong>Theo dõi từng bé</strong>
          <span>Chọn hồ sơ để xem thông tin của bé</span>
          <ArrowRight size={20} />
        </Link>
        <Link to="/parent/plan">
          <Package size={28} weight="duotone" />
          <strong>Thêm không gian sáng tạo</strong>
          <span>Tìm gói phù hợp với cả gia đình</span>
          <ArrowRight size={20} />
        </Link>
      </nav>
    </div>
  );
}
