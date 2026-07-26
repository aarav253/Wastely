import { motion } from "framer-motion";
import { ScanEye, Gauge, Sparkles, ShieldCheck, MapPin } from "lucide-react";

const features = [
  {
    icon: ScanEye,
    title: "Instant AI classification",
    desc: "Claude's vision model identifies the item in your photo and sorts it as recyclable or trash in seconds.",
  },
  {
    icon: MapPin,
    title: "Location-aware guidance",
    desc: "Set your state once and Wastely factors in that state's general recycling norms instead of generic national rules.",
  },
  {
    icon: Gauge,
    title: "Confidence you can see",
    desc: "Every result comes with a confidence score and a plain-language reason, not just a verdict.",
  },
  {
    icon: Sparkles,
    title: "Learns from your feedback",
    desc: "Correct a wrong call in one tap. Your corrections build a local dataset you can export for future improvements.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    desc: "Your scan history lives only in your browser's local storage — nothing is tracked or sent anywhere else.",
  },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Features</span>
          <h2>Everything you need to sort with confidence</h2>
          <p>A focused tool that does one thing well — tells you where an item belongs.</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="feature-icon">
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
