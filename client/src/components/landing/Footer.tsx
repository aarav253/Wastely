import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="brand" style={{ fontSize: "1rem" }}>
          <span className="brand-icon">
            <Leaf size={16} />
          </span>
          Wastely
        </div>
        <span className="footer-tagline">AI-powered waste sorting assistant</span>
        <span className="footer-note">&copy; {new Date().getFullYear()} Wastely · Powered by Claude vision AI</span>
      </div>
    </footer>
  );
}
