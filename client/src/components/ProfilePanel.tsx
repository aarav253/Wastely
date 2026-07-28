import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut, Flame, Trophy, ScanLine, Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { BADGES } from "../lib/badges";
import { gramsToPounds } from "../lib/weight";

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

interface ImpactStats {
  recyclableWeightGrams: number;
  trashWeightGrams: number;
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, profile, signOut } = useAuth();
  const [impact, setImpact] = useState<ImpactStats | null>(null);

  useEffect(() => {
    if (!open || !user || !supabase) return;
    supabase
      .from("scans")
      .select("category, estimated_weight_grams")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        let recyclable = 0;
        let trash = 0;
        for (const row of data as { category: string; estimated_weight_grams: number | string }[]) {
          const grams = Number(row.estimated_weight_grams) || 0;
          if (row.category === "recyclable") recyclable += grams;
          else trash += grams;
        }
        setImpact({ recyclableWeightGrams: recyclable, trashWeightGrams: trash });
      });
  }, [open, user]);

  if (!user) return null;

  const stats = {
    scanCount: profile?.scan_count ?? 0,
    points: profile?.points ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
  };
  const initial = (profile?.display_name || user.email || "?").charAt(0).toUpperCase();
  const totalWeightGrams = impact ? impact.recyclableWeightGrams + impact.trashWeightGrams : 0;
  const recyclableShare = totalWeightGrams > 0 ? (impact!.recyclableWeightGrams / totalWeightGrams) * 100 : 0;

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

            {impact && totalWeightGrams > 0 && (
              <>
                <h3 className="profile-section-title">
                  Your impact <span className="profile-section-note">(AI-estimated weights)</span>
                </h3>
                <div className="impact-card">
                  <div className="impact-headline">
                    <Leaf size={18} />
                    <span>{gramsToPounds(impact.recyclableWeightGrams).toFixed(1)} lbs</span>
                    diverted from landfill
                  </div>
                  <div className="impact-bar-track">
                    <div className="impact-bar-fill" style={{ width: `${recyclableShare}%` }} />
                  </div>
                  <div className="impact-bar-legend">
                    <span>{gramsToPounds(impact.recyclableWeightGrams).toFixed(1)} lbs recycled</span>
                    <span>{gramsToPounds(impact.trashWeightGrams).toFixed(1)} lbs trash</span>
                  </div>
                </div>
              </>
            )}

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
