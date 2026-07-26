import { motion } from "framer-motion";

const stats = [
  { num: "1 photo", desc: "is all it takes to get a clear recyclable-or-trash answer" },
  { num: "100%", desc: "of your scan history stays local — never uploaded anywhere else" },
  { num: "2", desc: "clear categories, no confusing sub-bins to guess between" },
];

export function Stats() {
  return (
    <section className="stats-band">
      <div className="container stats-grid">
        {stats.map((s, i) => (
          <motion.div
            key={s.num}
            className="stat-block"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
          >
            <div className="stat-num">{s.num}</div>
            <div className="stat-desc">{s.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
