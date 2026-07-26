import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <motion.div
          className="cta-banner"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Ready to scan smarter?</h2>
          <p>No account, no install — just open the app and point your camera.</p>
          <Link to="/app" className="btn btn-primary btn-lg">
            Launch Wastely
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
