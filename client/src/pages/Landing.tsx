import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Impact } from "../components/landing/Impact";
import { CtaBanner } from "../components/landing/CtaBanner";
import { Footer } from "../components/landing/Footer";

// Stats section hidden for now -- numbers look thin pre-launch, revisit once there's more usage data.
export function Landing() {
  return (
    <div className="landing">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Impact />
      <CtaBanner />
      <Footer />
    </div>
  );
}
