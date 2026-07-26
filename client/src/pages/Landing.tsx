import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { Stats } from "../components/landing/Stats";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Impact } from "../components/landing/Impact";
import { CtaBanner } from "../components/landing/CtaBanner";
import { Footer } from "../components/landing/Footer";

export function Landing() {
  return (
    <div className="landing">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Impact />
      <CtaBanner />
      <Footer />
    </div>
  );
}
