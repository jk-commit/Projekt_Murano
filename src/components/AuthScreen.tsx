import { useState, FormEvent, ReactNode } from "react";
import { MapPin, Mail, Lock, ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ORANGE, ORANGE_TINT } from "../theme";

const MIN_PASSWORD_LENGTH = 8;

type Mode = "signIn" | "signUp" | "forgot" | "updatePassword";

interface AuthScreenProps {
  recovery?: boolean;
}

function Field({
  icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  icon: ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <label className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all focus-within:border-orange-300 focus-within:shadow-sm">
      <span className="text-gray-400 ml-4 shrink-0">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="flex-1 min-w-0 py-3.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
      />
    </label>
  );
}

export function AuthScreen({ recovery = false }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>(recovery ? "updatePassword" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeMode: Mode = recovery ? "updatePassword" : mode;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if ((activeMode === "signUp" || activeMode === "updatePassword") && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      if (activeMode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (activeMode === "signUp") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Almost there! We sent you a confirmation email — click the link to activate your account.");
          setPassword("");
        }
      } else if (activeMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setNotice("If an account exists for this email, you'll receive a link to reset your password.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, { heading: string; sub: string; cta: string }> = {
    signIn: { heading: "Welcome back", sub: "Sign in to continue your city tours.", cta: "Sign in" },
    signUp: { heading: "Create your account", sub: "Join Marco and explore cities like a local.", cta: "Create account" },
    forgot: { heading: "Reset password", sub: "Enter your email and we'll send you a reset link.", cta: "Send reset link" },
    updatePassword: { heading: "Set a new password", sub: "Choose a new password for your account.", cta: "Save password" },
  };
  const t = titles[activeMode];
  const showTabs = activeMode === "signIn" || activeMode === "signUp";

  return (
    <div className="min-h-screen bg-white font-sans overflow-y-auto">
      <div className="absolute inset-x-0 top-0 h-72 pointer-events-none bg-gradient-to-b from-orange-50 to-white" />

      <div className="relative max-w-md mx-auto px-5 pt-14 pb-16 flex flex-col items-center">
        <span className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Marco</span>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wide uppercase"
          style={{ backgroundColor: ORANGE_TINT, color: ORANGE }}
        >
          <MapPin className="w-3.5 h-3.5" />
          Audio-guided city tours
        </div>

        <div className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          {showTabs && (
            <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6">
              {(["signIn", "signUp"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeMode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "signIn" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {activeMode === "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("signIn")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.heading}</h1>
          <p className="text-sm text-gray-500 mb-6">{t.sub}</p>

          {notice ? (
            <div className="flex gap-3 items-start rounded-xl p-4 text-sm text-gray-700" style={{ backgroundColor: "#FF5A1F12" }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: ORANGE }} />
              <p>{notice}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {activeMode !== "updatePassword" && (
                <Field
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Email address"
                  autoComplete="email"
                />
              )}
              {activeMode !== "forgot" && (
                <Field
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={activeMode === "signIn" ? "Password" : `New password (min. ${MIN_PASSWORD_LENGTH} characters)`}
                  autoComplete={activeMode === "signIn" ? "current-password" : "new-password"}
                />
              )}

              {activeMode === "signIn" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="self-end text-xs font-medium hover:underline"
                  style={{ color: ORANGE }}
                >
                  Forgot password?
                </button>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                style={{ backgroundColor: ORANGE }}
              >
                {loading ? "Please wait…" : t.cta}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center max-w-xs leading-relaxed">
          Discover cities with Marco, your AI-powered audio guide who knows every story behind every corner.
        </p>
      </div>
    </div>
  );
}
