import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, ArrowRight } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container navbar-inner">
        <a href="#top" className="brand">
          <span className="brand-icon">
            <Leaf size={18} />
          </span>
          Wastely
        </a>

        <div className="nav-links">
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#how-it-works" className="nav-link">
            How it works
          </a>
          <a href="#impact" className="nav-link">
            Impact
          </a>
        </div>

        <div className="nav-actions">
          <Link to="/app" className="btn btn-primary">
            Launch app
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
