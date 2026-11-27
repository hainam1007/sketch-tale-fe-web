import {
  ChartLineUp,
  IdentificationCard,
  SlidersHorizontal,
  UsersThree,
} from "@phosphor-icons/react";
import { usePublicData } from "../components/usePublicData";
import LandingHero from "../components/landing/LandingHero";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import StoryLibrarySection from "../components/landing/StoryLibrarySection";
import CharacterSection from "../components/landing/CharacterSection";
import ReadingSection from "../components/landing/ReadingSection";
import ParentSection from "../components/landing/ParentSection";
import PricingSection from "../components/landing/PricingSection";
import FinalSection from "../components/landing/FinalSection";
import "../components/landing/landing.css";

const parentSupportFacts = [
  [UsersThree, "Dành cho bố mẹ"],
  [IdentificationCard, "Hồ sơ riêng cho từng bé"],
  [ChartLineUp, "Theo dõi nhịp đọc"],
  [SlidersHorizontal, "Điều chỉnh giới hạn và duyệt nhân vật"],
];

export default function HomePage() {
  const stories = usePublicData("getSampleStories");
  const planAvailability = usePublicData("getPlanAvailability");
  return (
    <div className="landing-page">
      <LandingHero />
      <section
        className="landing-parent-quick"
        aria-label="Công cụ đồng hành cho phụ huynh"
      >
        <div className="landing-parent-quick-track">
          <div className="landing-parent-quick-track-inner">
            {[0, 1, 2, 3].map((copy) => (
              <ul
                className="landing-parent-quick-group"
                key={copy}
                aria-label={copy === 0 ? "Thông tin dành cho phụ huynh" : undefined}
                aria-hidden={copy > 0 || undefined}
              >
                {parentSupportFacts.map(([Icon, text]) => (
                  <li key={text}>
                    <Icon size={19} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>
      <HowItWorksSection />
      <StoryLibrarySection
        stories={stories.data}
        loading={stories.loading}
        error={stories.error}
      />
      <CharacterSection />
      <ReadingSection />
      <ParentSection />
      <PricingSection
        availability={planAvailability.data}
        loading={planAvailability.loading}
        error={planAvailability.error}
        onRetry={planAvailability.retry}
      />
      <FinalSection />
    </div>
  );
}
