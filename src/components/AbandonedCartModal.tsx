import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, ShoppingBag, Tag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const DISMISS_KEY = "pacifika_cart_dismissed";
const CHECKOUT_VISITED_KEY = "pacifika_checkout_visited";
const DISMISS_HOURS = 24;

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
  return hoursSince < DISMISS_HOURS;
}

function markDismissed() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export function markCheckoutVisited() {
  localStorage.setItem(CHECKOUT_VISITED_KEY, String(Date.now()));
}

export function clearCheckoutVisited() {
  localStorage.removeItem(CHECKOUT_VISITED_KEY);
}

export default function AbandonedCartModal() {
  const { items } = useCart();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    // Only show if: has items, not recently dismissed, didn't just visit checkout
    if (items.length === 0) return;
    if (wasRecentlyDismissed()) return;

    const checkoutVisited = localStorage.getItem(CHECKOUT_VISITED_KEY);
    if (checkoutVisited) {
      // If they visited checkout recently (< 5 min), don't bug them
      const minsSince = (Date.now() - parseInt(checkoutVisited, 10)) / (1000 * 60);
      if (minsSince < 5) return;
    }

    const timer = setTimeout(() => {
      setShow(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [items.length]);

  const handleDismiss = () => {
    setShow(false);
    markDismissed();
  };

  const handleGoToCart = () => {
    setShow(false);
    markDismissed();
    navigate("/cart");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("WELCOME10");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!show || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleDismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#0F1923] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-[#243656] rounded-full flex items-center justify-center"
        >
          <X size={16} />
        </button>

        {/* Header visual */}
        <div className="bg-gradient-to-br from-[#D4A03C]/20 to-[#5BA4CF]/20 p-6 text-center">
          <div className="w-16 h-16 bg-[#D4A03C] rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={28} className="text-[#1B2A4A]" />
          </div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Still Thinking It Over?
          </h2>
          <p className="text-sm text-[#8A94A6] mt-1">
            You have <strong className="text-[#F0EDE6]">{items.length} item{items.length > 1 ? "s" : ""}</strong> waiting in your bag
          </p>
        </div>

        {/* Items preview */}
        <div className="px-5 py-3 max-h-32 overflow-y-auto scrollbar-hide">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#243656] last:border-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-[#8A94A6]">Qty: {item.quantity}</p>
              </div>
              <span className="text-xs font-bold text-[#D4A03C]">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-[10px] text-[#8A94A6] text-center py-1">
              +{items.length - 3} more item{items.length > 4 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Promo incentive */}
        <div className="mx-5 mb-3 bg-[#243656] rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Tag size={18} className="text-[#D4A03C]" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#8A94A6]">Use code at checkout</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#D4A03C] text-sm">WELCOME10</span>
              <button
                onClick={handleCopyCode}
                className="text-[10px] bg-[#1B2A4A] px-2 py-0.5 rounded text-[#5BA4CF]"
              >
                {codeCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[10px] text-green-400">Save 10% on orders over $50</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleGoToCart}
            className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            Complete My Order
            <ArrowRight size={16} />
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-[#8A94A6] py-2 text-xs"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Cart Reminder (shown on Home when items exist) ─── */
export function CartReminderBanner() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="mx-4 mb-4 bg-[#243656] border border-[#D4A03C]/20 rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
        <ShoppingBag size={18} className="text-[#D4A03C]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {items.length} item{items.length > 1 ? "s" : ""} in your bag
        </p>
        <p className="text-xs text-[#8A94A6]">
          Subtotal: <span className="text-[#D4A03C] font-bold">${subtotal.toFixed(2)}</span>
        </p>
      </div>
      <button
        onClick={() => navigate("/cart")}
        className="bg-[#D4A03C] text-[#1B2A4A] px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
      >
        View Bag
      </button>
    </div>
  );
}
