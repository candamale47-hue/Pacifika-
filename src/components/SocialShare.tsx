import { useState } from "react";
import { Share2, Facebook, Link2, Check, MessageCircle } from "lucide-react";

interface SocialShareProps {
  productName: string;
  productSlug: string;
  productImage?: string;
}

export default function SocialShare({ productName, productSlug, productImage }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const url = `${window.location.origin}/product/${productSlug}`;
  const shareText = `Check out ${productName} from Pacifika Wear!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
  };

  const handleWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="flex items-center gap-1.5 text-xs text-[#8A94A6] hover:text-[#D4A03C] transition-colors"
      >
        <Share2 size={14} /> Share
      </button>

      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSheet(false)} />
          <div className="relative w-full max-w-lg bg-[#243656] rounded-t-2xl p-4 space-y-3">
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-center">Share This Product</h3>

            <button
              onClick={handleFacebook}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1B2A4A] hover:bg-[#1877F2]/20 transition-colors"
            >
              <Facebook size={20} className="text-[#1877F2]" />
              <span className="text-sm">Share on Facebook</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1B2A4A] hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={20} className="text-[#25D366]" />
              <span className="text-sm">Share on WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1B2A4A] hover:bg-[#D4A03C]/20 transition-colors"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Link2 size={20} className="text-[#D4A03C]" />}
              <span className="text-sm">{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={() => setShowSheet(false)}
              className="w-full py-3 text-sm text-[#8A94A6] hover:text-[#F0EDE6]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
