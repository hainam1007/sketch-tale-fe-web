import {
  Plus,
  BookOpen,
  ChartBar,
  Package,
  ArrowRight,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import FamilyProfilesLive from "../components/FamilyProfilesLive";
import { moduleApiModes } from "../../../lib/api/featureApi";
import FamilyProfilesStatus from "../components/FamilyProfilesStatus";
import FamilyProfilesPreview, {
  showFamilyProfilePreview,
} from "../components/FamilyProfilesPreview";
import "../parent-overview.css";

export default function ParentOverviewPage() {
  const { user } = useAuth();
  const firstName = user.name?.trim().split(/\s+/).at(-1) || "bạn";

  return (
    <div className="parent-page parent-entry-page">
      <header className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">PHỤ HUYNH / TỔNG QUAN</p>
          <h1>Chào {firstName}, hôm nay mình đọc gì?</h1>
          <p>
            Tạo không gian riêng cho từng bé để gia đình đồng hành mỗi ngày.
          </p>
        </div>
        <Link
          className="workspace-button parent-entry-add-button"
          to="/parent/children/new"
        >
          <Plus size={18} aria-hidden="true" /> Thêm tài khoản bé
        </Link>
      </header>
      {moduleApiModes.parentProfile === "real" ? (
        <FamilyProfilesLive />
      ) : showFamilyProfilePreview ? (
        <FamilyProfilesPreview overview />
      ) : (
        <FamilyProfilesStatus showCreate={false} />
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
        <Link to="/parent/reports">
          <ChartBar size={28} weight="duotone" />
          <strong>Nhìn lại bước tiến</strong>
          <span>Thói quen đọc và những điều bé đã học</span>
          <ArrowRight size={20} />
        </Link>
        <Link to="/parent/plan">
          <Package size={28} weight="duotone" />
          <strong>Thêm không gian sáng tạo</strong>
          <span>Tìm gói phù hợp với cả gia đình</span>
          <ArrowRight size={20} />
        </Link>
      </nav>
      <aside className="family-daily-tip">
        <img src="/images/seed.webp" alt="" />
        <div>
          <p className="workspace-eyebrow">10 PHÚT BÊN NHAU</p>
          <h2>Một câu hỏi nhỏ, một cuộc trò chuyện hay.</h2>
          <p>Sau khi đọc, thử hỏi bé: “Con thích nhân vật nào nhất? Vì sao?”</p>
        </div>
      </aside>
    </div>
  );
}
