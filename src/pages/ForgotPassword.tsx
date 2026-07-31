import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const forgot = trpc.localAuth.forgotPassword.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    forgot.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/login")} className="p-1"><ArrowLeft size={20} /></button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <img src="/logo.png" alt="Pacifika Wear" className="h-24 w-auto object-contain mb-4" />
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Reset Password</h1>

        {!submitted ? (
          <>
            <p className="text-[#8A94A6] text-sm mb-6 text-center">Enter your email and we&apos;ll send you a reset code.</p>
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
              {error && <div className="bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg p-3 text-xs text-[#E53935]">{error}</div>}
              <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
              <button type="submit" disabled={forgot.isPending}
                className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={16} /> {forgot.isPending ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          </>
        ) : (
          <div className="w-full max-w-xs space-y-4 text-center">
            <div className="bg-[#243656] rounded-xl p-6">
              <Mail size={32} className="text-[#D4A03C] mx-auto mb-3" />
              <p className="text-sm font-semibold mb-2">Check your email</p>
              <p className="text-xs text-[#8A94A6]">
                If an account exists for <strong className="text-white">{email}</strong>, we sent a 6-digit reset code. Check your inbox and spam folder.
              </p>
            </div>
            <button onClick={() => navigate("/reset-password")}
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm">
              Enter Reset Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
