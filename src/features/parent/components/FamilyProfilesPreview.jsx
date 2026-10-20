import { ArrowRight, BookOpen, Clock } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { featureApiModes } from "../../../lib/api/featureApi";

export const previewProfiles = [
  {
    id: "preview-may",
    name: "Mây",
    age: "6 tuổi",
    avatar: "/images/seed.webp",
    recentStory: "Khu vườn của Mây",
    readingMinutes: 46,
    storiesCompleted: 3,
  },
  {
    id: "preview-nang",
    name: "Nắng",
    age: "4 tuổi",
    avatar: "/images/rabbit.webp",
    recentStory: "Chú thỏ tìm bạn",
    readingMinutes: 32,
    storiesCompleted: 2,
  },
];

export const showFamilyProfilePreview = import.meta.env.DEV && featureApiModes.parent === "mock";
export const getFamilyProfilePreview = (childId) =>
  showFamilyProfilePreview ? previewProfiles.find((profile) => profile.id === childId) || null : null;

export default function FamilyProfilesPreview({ overview = false }) {
  return (
    <section className="parent-entry-profiles" aria-labelledby="family-profiles-heading">
      <div className="parent-entry-section-label">
        <h2 id="family-profiles-heading">KHÔNG GIAN GIA ĐÌNH</h2>
        <span>{previewProfiles.length} hồ sơ</span>
      </div>
      <div className="parent-entry-picker">
        <div className="parent-entry-picker-heading">
          <div>
            <p className="workspace-eyebrow">HÀNH TRÌNH ĐỌC</p>
            <h2>{overview ? "Bố mẹ đồng hành cùng bé" : "Hồ sơ trong gia đình"}</h2>
          </div>
          <span>Hoạt động trong tuần này</span>
        </div>
        <div className="parent-entry-child-grid">
          {previewProfiles.map((profile) => (
            <Link className="parent-entry-child" key={profile.id} to={`/parent/children/${profile.id}`} aria-label={`Xem chi tiết hồ sơ của ${profile.name}`}>
              <img src={profile.avatar} alt="" width="56" height="56" />
              <span className="parent-entry-child-copy">
                <strong>{profile.name}</strong>
                <small>{profile.age} · Truyện gần đây: {profile.recentStory}</small>
              </span>
              <div className="parent-entry-metrics" aria-label={`Hoạt động tuần này của ${profile.name}`}>
                <div className="parent-entry-metric"><Clock size={15} aria-hidden="true" />{profile.readingMinutes} phút</div>
                <div className="parent-entry-metric is-blue"><BookOpen size={15} aria-hidden="true" />{profile.storiesCompleted} truyện</div>
              </div>
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
