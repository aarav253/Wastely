import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface LeaderboardRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  scan_count: number;
}

export function Leaderboard() {
  const { configured, user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, points, scan_count")
      .order("points", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows((data as LeaderboardRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (!configured) {
    return <p className="history-empty">Sign in with Google to see the leaderboard.</p>;
  }

  if (loading) {
    return <p className="history-empty">Loading leaderboard…</p>;
  }

  if (rows.length === 0) {
    return <p className="history-empty">No scans yet — be the first on the board.</p>;
  }

  return (
    <ul className="leaderboard-list">
      {rows.map((row, i) => (
        <li key={row.id} className={`leaderboard-item ${row.id === user?.id ? "leaderboard-item-me" : ""}`}>
          <span className="leaderboard-rank">{i + 1}</span>
          {row.avatar_url ? (
            <img src={row.avatar_url} alt="" className="leaderboard-avatar" referrerPolicy="no-referrer" />
          ) : (
            <span className="leaderboard-avatar-fallback">{(row.display_name || "?").charAt(0).toUpperCase()}</span>
          )}
          <span className="leaderboard-name">{row.display_name || "Anonymous scanner"}</span>
          <span className="leaderboard-points">
            <Trophy size={12} />
            {row.points}
          </span>
        </li>
      ))}
    </ul>
  );
}
