import { ArrowRight, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import ChildAvatar from "./ChildAvatar";
import { savedAvatar } from "../services/profilePresentation";

const mockDailyLimits = [45, 30, 60];
const progressSegments = Array.from({ length: 12 }, (_, index) => index);

function readMinutes(value) {
  if (value === null || value === undefined || value === "") return null;
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes >= 0 ? Math.floor(minutes) : null;
}

function stableMockMinutes(profile, index, limit) {
  const seed = String(profile.id || `child-${index}`)
    .split("")
    .reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) % 997, 7);
  return Math.min(limit, Math.round(limit * (0.24 + (seed % 47) / 100)));
}

function resolveTimeBudget(profile, index) {
  const dailyLimit = readMinutes(profile.dailyTimeLimit ?? profile.DailyTimeLimit);
  const remaining = readMinutes(profile.remainingTimeLimit ?? profile.RemainingTimeLimit);

  if (dailyLimit !== null && remaining !== null) {
    const used = Math.min(dailyLimit, Math.max(0, dailyLimit - remaining));
    return { used, allowed: dailyLimit, remaining: dailyLimit - used, source: "api" };
  }

  const allowed = dailyLimit ?? mockDailyLimits[index % mockDailyLimits.length];
  const previewUsed = readMinutes(profile.timeUsedToday ?? profile.dailyTimeUsed);
  const used = Math.min(allowed, previewUsed ?? stableMockMinutes(profile, index, allowed));
  return { used, allowed, remaining: allowed - used, source: "mock" };
}

export function FamilyProfileCard({ profile, index = 0, userId }) {
  const profileId = profile.id ?? profile.Id;
  const name = profile.nickName || profile.NickName || profile.name || "Bé của bạn";
  const time = resolveTimeBudget(profile, index);
  const percentage = time.allowed > 0 ? Math.min(100, (time.used / time.allowed) * 100) : 0;
  const filledSegments = Math.round((percentage / 100) * progressSegments.length);

  return (
    <article className="family-profile-card family-child-profile-card">
      <div className="family-pixel-card">
        <header className="family-pixel-card__header">
          <span className="family-pixel-card__brand">
            <span className="family-pixel-card__brand-mark" aria-hidden="true" />
            SKETCHTALE <i aria-hidden="true">/</i> HỒ SƠ ĐỌC
          </span>
          <span className="family-pixel-card__serial">
            {String(index + 1).padStart(2, "0")}
          </span>
        </header>

        <div className="family-pixel-card__scene">
          <div className="family-child-avatar">
            <ChildAvatar
              id={profileId}
              index={savedAvatar(userId, profileId, index)}
              size={80}
            />
          </div>
        </div>

        <div className="family-pixel-card__details">
          <div className="family-pixel-card__name-row">
            <div className="family-pixel-card__name-wrap">
              <span className="family-pixel-card__eyebrow">NHÀ THÁM HIỂM NHÍ</span>
              <h3 className="family-child-profile-name" title={name}>{name}</h3>
            </div>
          </div>

          <div className="family-pixel-card__footer">
            <section
              className="family-pixel-card__usage"
              aria-label={`Thời gian sử dụng hôm nay của ${name}`}
            >
              <div className="family-pixel-card__usage-heading">
                <span>THỜI GIAN HÔM NAY</span>
                {time.source === "mock" && (
                  <span
                    className="family-pixel-card__source is-mock"
                    aria-label="Số liệu minh họa"
                    title="Chưa có dữ liệu thời gian sử dụng từ API"
                  >
                    MẪU
                  </span>
                )}
              </div>

              <div className="family-pixel-card__time-values">
                <div className="family-pixel-card__time-value">
                  <strong>{time.used}</strong>
                  <span className="sr-only">phút đã dùng</span>
                </div>
                <span className="family-pixel-card__time-divider" aria-hidden="true">/</span>
                <div className="family-pixel-card__time-value is-allowed">
                  <strong>{time.allowed}</strong>
                  <span className="sr-only">phút được phép</span>
                </div>
                <span className="family-pixel-card__time-unit">phút</span>
              </div>

              <div
                className="family-pixel-card__meter"
                role="progressbar"
                aria-label={`Đã dùng ${time.used} trên ${time.allowed} phút`}
                aria-valuemin={0}
                aria-valuenow={time.used}
                aria-valuemax={Math.max(time.allowed, 1)}
                aria-valuetext={`${time.used} phút đã dùng trên ${time.allowed} phút được phép`}
              >
                {progressSegments.map((segment) => (
                  <span
                    className={segment < filledSegments ? "is-filled" : ""}
                    key={segment}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </section>

            <Link
              className="family-pixel-card__button"
              to={`/parent/children/${encodeURIComponent(profileId)}`}
              aria-label={`Mở trang cá nhân của ${name}`}
              title={`Mở trang cá nhân của ${name}`}
            >
              <ArrowRight size={21} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FamilyAddProfileCard() {
  return (
    <Link className="family-add-card family-child-add-card" to="/parent/children/new">
      <span className="family-child-add-icon">
        <Plus size={26} aria-hidden="true" />
      </span>
      <strong>Thêm một bạn nhỏ</strong>
      <p>Tạo không gian đọc riêng cho thành viên mới</p>
    </Link>
  );
}
