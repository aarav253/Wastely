import { LogIn, ScanLine, Trophy, Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function AuthGate() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="auth-gate">
      <div className="auth-gate-icon">
        <Leaf size={26} />
      </div>
      <h2>Sign in to use Wastely</h2>
      <p>
        An account lets us save your scans, track your points and streaks, and build your
        personal recycling impact over time — so it's required before you can start scanning.
      </p>

      <button type="button" className="btn btn-primary btn-lg auth-gate-btn" onClick={signInWithGoogle}>
        <LogIn size={18} />
        Sign in with Google
      </button>

      <div className="auth-gate-perks">
        <span>
          <ScanLine size={14} />
          Unlimited scans
        </span>
        <span>
          <Trophy size={14} />
          Points, streaks &amp; leaderboard
        </span>
      </div>
    </div>
  );
}
