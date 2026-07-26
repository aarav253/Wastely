import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Sparkles, ShieldCheck, Zap, Recycle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: "easeOut" },
  }),
};

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg-blob blob-one" />
      <div className="hero-bg-blob blob-two" />

      <div className="container hero-inner">
        <div>
          <motion.div className="eyebrow" custom={0} initial="hidden" animate="show" variants={fadeUp}>
            <Sparkles size={14} />
            AI-powered waste sorting
          </motion.div>

          <motion.h1 custom={0.08} initial="hidden" animate="show" variants={fadeUp}>
            Know exactly <span className="gradient-text">where it goes.</span>
          </motion.h1>

          <motion.p className="hero-sub" custom={0.16} initial="hidden" animate="show" variants={fadeUp}>
            Point your camera at anything. Wastely's vision AI identifies the item and tells you instantly —
            recyclable or trash — with a confidence score and a reason you can trust.
          </motion.p>

          <motion.div className="hero-ctas" custom={0.24} initial="hidden" animate="show" variants={fadeUp}>
            <Link to="/app" className="btn btn-primary btn-lg">
              Launch Wastely
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              <PlayCircle size={18} />
              See how it works
            </a>
          </motion.div>

          <motion.div className="hero-trust" custom={0.32} initial="hidden" animate="show" variants={fadeUp}>
            <span className="hero-trust-item">
              <Zap size={15} />
              Results in seconds
            </span>
            <span className="hero-trust-item">
              <ShieldCheck size={15} />
              History stays on your device
            </span>
            <span className="hero-trust-item">
              <Recycle size={15} />
              Built to reduce contamination
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          style={{ position: "relative" }}
        >
          <div className="device-frame">
            <div className="device-notch" />
            <div className="device-screen">
              <div className="mock-photo">
                <Recycle size={36} opacity={0.5} />
                <div className="mock-icon-badge">
                  <Recycle size={18} />
                </div>
              </div>
              <span className="mock-pill">Recyclable</span>
              <span className="mock-title">Aluminum can</span>
              <div className="mock-bar-track">
                <div className="mock-bar-fill" />
              </div>
              <span className="mock-reason">96% confident — accepted in curbside recycling</span>
            </div>
          </div>

          <motion.div
            className="floating-chip chip-one"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Recycle size={14} />
            Recyclable
          </motion.div>
          <motion.div
            className="floating-chip chip-two"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <Sparkles size={14} />
            Learns from you
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
