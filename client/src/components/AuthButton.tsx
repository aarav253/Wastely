import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthButtonProps {
  onOpenProfile: () => void;
}

export function AuthButton({ onOpenProfile }: AuthButtonProps) {
  const { configured, loading, user, profile, signInWithGoogle } = useAuth();

  if (!configured || loading) return null;

  if (!user) {
    return (
      <button type="button" className="auth-button auth-button-signin" onClick={signInWithGoogle}>
        <LogIn size={14} />
        Sign in with Google
      </button>
    );
  }

  const initial = (profile?.display_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <button type="button" className="auth-button auth-button-profile" onClick={onOpenProfile}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="auth-avatar" referrerPolicy="no-referrer" />
      ) : (
        <span className="auth-avatar-fallback">{initial}</span>
      )}
      <span>{profile?.points ?? 0} pts</span>
    </button>
  );
}
