import { motion } from "framer-motion";

const steps = [
  {
    n: "1",
    title: "Capture",
    desc: "Point your camera at an item, or upload a photo. No sign-up, no setup.",
  },
  {
    n: "2",
    title: "Classify",
    desc: "Wastely's vision AI identifies the item and checks it against curbside recycling rules.",
  },
  {
    n: "3",
    title: "Sort",
    desc: "Get a clear recyclable-or-trash answer with a reason, then toss it in the right bin.",
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works" style={{ background: "var(--surface-soft)" }}>
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">How it works</span>
          <h2>Three steps, no guesswork</h2>
          <p>From photo to answer in one smooth flow.</p>
        </div>

        <div className="steps">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              className="step"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
            >
              <div className="step-number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
