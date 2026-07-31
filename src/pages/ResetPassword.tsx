import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = trpc.localAuth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    reset.mutate({ email: email.trim(), code, newPassword });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/login")} className="p-1"><ArrowLeft size={20} /></button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <img src="/logo.png" alt="Pacifika Wear" className="h-24 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>New Password</h1>

        {!success ? (
          <>
            <p className="text-[#8A94A6] text-sm mb-6 text-center">Enter your email, reset code, and new password.</p>
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
              {error && <div className="bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg p-3 text-xs text-[#E53935]">{error}</div>}
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
              <input type="text" placeholder="Reset Code (6 digits)" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono tracking-wider text-center" />
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                <input type={showPassword ? "text" : "password"} placeholder="New Password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#243656] rounded-lg pl-10 pr-10 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={reset.isPending}
                className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm disabled:opacity-50">
                {reset.isPending ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        ) : (
          <div className="w-full max-w-xs text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <p className="text-lg font-semibold">Password Updated!</p>
            <p className="text-sm text-[#8A94A6]">Your password has been changed successfully.</p>
            <button onClick={() => navigate("/login")}
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
