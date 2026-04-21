import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { DashboardPreview } from '../components/DashboardPreview';
import { AboutSection } from '../components/AboutSection';
import { Footer } from '../components/Footer';
import { BackToTop } from '../components/BackToTop';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-['Poppins',sans-serif]">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DashboardPreview />
        <AboutSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
