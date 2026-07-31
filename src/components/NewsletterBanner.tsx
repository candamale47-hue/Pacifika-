import { useState } from "react";
import { Mail, Send, Check, X } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface NewsletterBannerProps {
  variant?: "banner" | "footer" | "inline";
  onDismiss?: () => void;
}

export default function NewsletterBanner({ variant = "banner", onDismiss }: NewsletterBannerProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
      setEmail("");
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("idle");
    subscribe.mutate({ email: email.trim() });
  };

  if (variant === "footer") {
    return (
      <div className="bg-[#243656] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={16} className="text-[#D4A03C]" />
          <h3 className="text-sm font-semibold">Stay in the Loop</h3>
        </div>
        <p className="text-xs text-[#8A94A6] mb-3">New collection drops & exclusive offers.</p>
        {status === "success" ? (
          <div className="flex items-center gap-2 text-green-400 text-xs py-2">
            <Check size={14} />
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-xs border border-transparent focus:border-[#D4A03C] outline-none"
              required
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-[#D4A03C] text-[#1B2A4A] px-4 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="bg-[#243656] rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[#D4A03C]" />
            <h3 className="text-sm font-semibold">Newsletter</h3>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="p-1 -mr-1 -mt-1">
              <X size={14} className="text-[#8A94A6]" />
            </button>
          )}
        </div>
        <p className="text-xs text-[#8A94A6] mb-3">
          Be the first to know about new Pacific Island designs and exclusive discounts.
        </p>
        {status === "success" ? (
          <div className="flex items-center gap-2 text-green-400 text-xs py-2">
            <Check size={14} />
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-xs border border-transparent focus:border-[#D4A03C] outline-none"
              required
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-[#D4A03C] text-[#1B2A4A] px-4 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <Send size={12} />
              Join
            </button>
          </form>
        )}
      </div>
    );
  }

  // Banner variant (homepage hero section follow-up)
  return (
    <div className="bg-[#D4A03C]/10 border border-[#D4A03C]/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Mail size={18} className="text-[#D4A03C]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">Join the Pacifika Family</h3>
          <p className="text-xs text-[#8A94A6] mt-0.5 mb-3">
            Get 10% off your first order + early access to new collections.
          </p>
          {status === "success" ? (
            <div className="flex items-center gap-2 text-green-400 text-xs py-2">
              <Check size={14} />
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-xs border border-transparent focus:border-[#D4A03C] outline-none"
                required
              />
              <button
                type="submit"
                disabled={subscribe.isPending}
                className="bg-[#D4A03C] text-[#1B2A4A] px-4 rounded-lg text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                {subscribe.isPending ? "..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 -mr-1 -mt-1 flex-shrink-0">
            <X size={14} className="text-[#8A94A6]" />
          </button>
        )}
      </div>
    </div>
  );
}
