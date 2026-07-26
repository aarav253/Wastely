import { Star, Award, Medal, Trophy, Flame, Crown, type LucideIcon } from "lucide-react";

export interface BadgeStats {
  scanCount: number;
  points: number;
  longestStreak: number;
}

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isEarned: (stats: BadgeStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first-scan", label: "First Scan", description: "Complete your first scan", icon: Star, isEarned: (s) => s.scanCount >= 1 },
  { id: "getting-started", label: "Getting Started", description: "10 scans completed", icon: Award, isEarned: (s) => s.scanCount >= 10 },
  { id: "sorting-pro", label: "Sorting Pro", description: "50 scans completed", icon: Medal, isEarned: (s) => s.scanCount >= 50 },
  { id: "eco-veteran", label: "Wastely Veteran", description: "200 scans completed", icon: Trophy, isEarned: (s) => s.scanCount >= 200 },
  { id: "streak-3", label: "3-Day Streak", description: "Scanned 3 days in a row", icon: Flame, isEarned: (s) => s.longestStreak >= 3 },
  { id: "week-warrior", label: "Week Warrior", description: "Scanned 7 days in a row", icon: Flame, isEarned: (s) => s.longestStreak >= 7 },
  { id: "monthly-master", label: "Monthly Master", description: "Scanned 30 days in a row", icon: Flame, isEarned: (s) => s.longestStreak >= 30 },
  { id: "century-club", label: "Century Club", description: "Earned 100 points", icon: Crown, isEarned: (s) => s.points >= 100 },
];
