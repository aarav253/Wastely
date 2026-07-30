import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** null when Supabase isn't configured yet -- callers must treat accounts/points as unavailable, not error. */
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

/** Verifies a Supabase access token from an Authorization: Bearer header. Returns null if absent/invalid/unconfigured. */
export async function getUserFromAuthHeader(authHeader: string | undefined): Promise<User | null> {
  if (!supabaseAdmin || !authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export interface RecordScanResult {
  scanId: string;
  points: number;
  scanCount: number;
  currentStreak: number;
  longestStreak: number;
}

export async function recordScan(
  userId: string,
  scan: {
    itemName: string;
    category: string;
    confidence: number;
    reason: string;
    state?: string;
    estimatedWeightGrams?: number;
    materialCategory?: string;
  }
): Promise<RecordScanResult | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .rpc("record_scan", {
      p_user_id: userId,
      p_item_name: scan.itemName,
      p_category: scan.category,
      p_confidence: scan.confidence,
      p_reason: scan.reason,
      p_state: scan.state ?? null,
      p_estimated_weight_grams: scan.estimatedWeightGrams ?? 0,
      p_material_category: scan.materialCategory ?? "other",
    })
    .single();

  if (error) {
    console.error("record_scan failed:", error);
    return null;
  }
  const row = data as { scan_id: string; points: number; scan_count: number; current_streak: number; longest_streak: number };
  return {
    scanId: row.scan_id,
    points: row.points,
    scanCount: row.scan_count,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
  };
}

export async function recordFeedback(
  scanId: string,
  userId: string,
  corrected: boolean,
  correctedCategory: string | null
): Promise<{ points: number } | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .rpc("record_feedback", {
      p_scan_id: scanId,
      p_user_id: userId,
      p_corrected: corrected,
      p_corrected_category: correctedCategory,
    })
    .single();

  if (error) {
    console.error("record_feedback failed:", error);
    return null;
  }
  return data as { points: number };
}
