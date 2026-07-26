import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const points = [
  "A single greasy pizza box or food-soiled container can contaminate an entire batch of otherwise recyclable material.",
  "Plastic bags and film jam sorting machinery — they belong in the trash, not loose in a curbside bin.",
  "When an item's recyclability is genuinely unclear, Wastely defaults to trash to avoid contaminating the recycling stream.",
];

export function Impact() {
  return (
    <section className="section" id="impact">
      <div className="container">
        <motion.div
          className="impact"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span className="section-eyebrow">Why it matters</span>
            <h2>Sorting correctly is what actually gets things recycled</h2>
            <p>
              Recycling only works if what goes in the bin is genuinely recyclable. Guessing wrong — in either
              direction — undermines the whole system. Wastely is built to make the right call obvious.
            </p>
          </div>
          <ul className="impact-list">
            {points.map((p) => (
              <li key={p}>
                <CheckCircle2 size={18} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
