import HeroSection from "@/client/components/Sections/HeroSection";

/**
 * HomePage Component
 * Serves as the main landing page of the application.
 * Displays a hero section with a gradient background effect.
 */
export default function HomePage() {
  return (
    <div className="bg-white bg-gradient-to-b from-black/80 to-black/100">
      {/* Hero Section - Main visual component for the homepage */}
      <HeroSection />
    </div>
  );
}
