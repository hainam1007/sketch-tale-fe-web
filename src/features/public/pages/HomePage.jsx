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

export default function HomePage() {
  const stories = usePublicData("getSampleStories");
  return (
    <div className="landing-page">
      <LandingHero />
      <HowItWorksSection />
      <StoryLibrarySection
        stories={stories.data}
        loading={stories.loading}
        error={stories.error}
      />
      <CharacterSection />
      <ReadingSection />
      <ParentSection />
      <PricingSection />
      <FinalSection />
    </div>
  );
}
