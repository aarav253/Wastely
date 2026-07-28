import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { gramsToPounds } from "../../lib/weight";

const staticStats = [
  { num: "1 photo", desc: "is all it takes to get a clear recyclable-or-trash answer" },
  { num: "100%", desc: "of your scan history stays local — never uploaded anywhere else" },
  { num: "2", desc: "clear categories, no confusing sub-bins to guess between" },
];

interface GlobalStats {
  num: string;
  desc: string;
}

export function Stats() {
  const [liveStat, setLiveStat] = useState<GlobalStats | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .rpc("get_global_impact_stats")
      .single()
      .then(({ data }) => {
        const row = data as { total_scans: number; total_weight_grams: number } | null;
        if (!row || !row.total_scans) return;
        const lbs = gramsToPounds(Number(row.total_weight_grams) || 0);
        setLiveStat({
          num: `${lbs < 1 ? lbs.toFixed(2) : Math.round(lbs)} lbs`,
          desc: "of waste scanned by the Wastely community so far (AI-estimated)",
        });
      });
  }, []);

  const stats = liveStat ? [liveStat, ...staticStats] : staticStats;

  return (
    <section className="stats-band">
      <div className="container stats-grid">
        {stats.map((s, i) => (
          <motion.div
            key={s.num + i}
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
