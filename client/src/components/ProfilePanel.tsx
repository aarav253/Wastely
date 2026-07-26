import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut, Flame, Trophy, ScanLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BADGES } from "../lib/badges";

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const stats = {
    scanCount: profile?.scan_count ?? 0,
    points: profile?.points ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
  };
  const initial = (profile?.display_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="profile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="profile-panel"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="profile-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>

            <div className="profile-header">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="profile-avatar-fallback">{initial}</div>
              )}
              <div>
                <div className="profile-name">{profile?.display_name || user.email}</div>
                <div className="profile-points">{stats.points} points</div>
              </div>
            </div>

            <div className="profile-stats-row">
              <div className="profile-stat">
                <ScanLine size={16} />
                <span>{stats.scanCount}</span>
                <label>Scans</label>
              </div>
              <div className="profile-stat">
                <Flame size={16} />
                <span>{profile?.current_streak ?? 0}</span>
                <label>Streak</label>
              </div>
              <div className="profile-stat">
                <Trophy size={16} />
                <span>{stats.longestStreak}</span>
                <label>Best streak</label>
              </div>
            </div>

            <h3 className="profile-section-title">Badges</h3>
            <div className="badge-grid">
              {BADGES.map((b) => {
                const earned = b.isEarned(stats);
                return (
                  <div
                    key={b.id}
                    className={`badge-tile ${earned ? "badge-earned" : "badge-locked"}`}
                    title={b.description}
                  >
                    <b.icon size={20} />
                    <span>{b.label}</span>
                  </div>
                );
              })}
            </div>

            <button type="button" className="btn btn-secondary profile-signout" onClick={signOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
