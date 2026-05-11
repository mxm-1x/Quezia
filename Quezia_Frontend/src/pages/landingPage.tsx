import Navbar from '../components/landingpage/navbar';
import AnnouncementBanner from '../components/landingpage/announcementBanner';
import Hero from '../components/landingpage/hero';
import Solutions from '../components/landingpage/solutions';
import SocialProof from '../components/landingpage/socialProof';
import Features from '../components/landingpage/features';
import About from '../components/landingpage/about';
import Pricing from '../components/landingpage/pricing';
import Footer from '../components/landingpage/footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <AnnouncementBanner />
      <Hero />
      <Solutions />
      <SocialProof />
      <Features />
      <About />
      <Pricing />
      <Footer />
    </div>
  );
};

export default LandingPage;
