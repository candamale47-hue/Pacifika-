import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff, Globe, User } from "lucide-react";
import { trpc } from "@/providers/trpc";

function getOAuthUrl() {
  const authUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${authUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation();
  const registerMutation = trpc.localAuth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await loginMutation.mutateAsync({ email, password });
        localStorage.setItem("local_auth_token", result.token);
        window.location.href = "/account";
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        const result = await registerMutation.mutateAsync({
          email,
          password,
          name: name.trim(),
        });
        localStorage.setItem("local_auth_token", result.token);
        window.location.href = "/account";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <img src="/logo.png" alt="Pacifika Wear" className="h-24 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
          Pacifika Wear
        </h1>
        <p className="text-[#8A94A6] text-sm mb-8">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          {error && (
            <div className="bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg p-3 text-xs text-[#E53935]">
              {error}
            </div>
          )}

          {mode === "register" && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#243656] rounded-lg pl-10 pr-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#243656] rounded-lg pl-10 pr-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#243656] rounded-lg pl-10 pr-10 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
          {mode === "login" && (
            <Link to="/forgot-password" className="block text-center text-xs text-[#8A94A6] mt-2 hover:text-[#D4A03C]">
              Forgot Password?
            </Link>
          )}
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          className="mt-4 text-[#8A94A6] text-sm hover:text-[#D4A03C]"
        >
          {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>

        <div className="w-full max-w-xs flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#8A94A6]/20" />
          <span className="text-[#8A94A6] text-xs">or</span>
          <div className="flex-1 h-px bg-[#8A94A6]/20" />
        </div>

        <a
          href={getOAuthUrl()}
          className="w-full max-w-xs border border-[#243656] text-[#F0EDE6] py-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#243656]/50"
        >
          <Globe size={16} className="text-[#5BA4CF]" />
          Sign In with Kimi OAuth
        </a>

        <Link to="/shop" className="mt-6 text-[#8A94A6] text-xs hover:text-[#5BA4CF]">
          Continue as Guest
        </Link>
      </div>
    </div>
  );
}
