import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trpc } from "@/providers/trpc";
import LazyImage from "@/components/LazyImage";
import { trackViewCart, trackPromoCode } from "@/lib/analytics";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ discount: number; message: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoInput, setPromoInput] = useState("");

  const { data: promoResult } = trpc.promo.validate.useQuery(
    { code: promoInput, orderTotal: subtotal },
    { enabled: !!promoInput }
  );

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoInput(promoCode);
    if (promoResult) {
      if (promoResult.valid) {
        trackPromoCode(promoCode, promoResult.discount ?? 0);
        setPromoApplied({ discount: promoResult.discount ?? 0, message: promoResult.message ?? "" });
      } else {
        setPromoError(promoResult.message ?? "Invalid code");
        setPromoApplied(null);
      }
    } else {
      setPromoError("Failed to validate code");
    }
  };

  const discount = promoApplied?.discount ?? 0;
  const total = subtotal - discount;

  // Track cart view
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart(
        items.map((i) => ({
          id: String(i.productId),
          name: i.name,
          category: "",
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Shopping Bag
        </h1>
        <span className="text-[#8A94A6] text-sm">({items.length})</span>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <ShoppingBag size={64} className="text-[#8A94A6]/40 mb-4" />
          <p className="text-[#8A94A6] mb-2">Your bag is empty</p>
          <p className="text-[#8A94A6]/60 text-sm text-center mb-6">Add some Pacific Island fashion to your bag</p>
          <Link
            to="/shop"
            className="px-8 py-3 border border-[#D4A03C] text-[#D4A03C] rounded-lg font-medium text-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="px-4 space-y-3 mt-2">
            {items.map((item) => (
              <div key={item.id} className="bg-[#243656] rounded-xl p-3 flex gap-3">
                <LazyImage src={item.image} alt={item.name} className="w-20 h-20 rounded-lg flex-shrink-0 bg-[#1B2A4A]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  {item.size && <p className="text-[#8A94A6] text-xs mt-0.5">Size: {item.size}</p>}
                  <p className="text-[#D4A03C] font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 bg-[#1B2A4A] rounded-md flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-[#1B2A4A] rounded-md flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-[#8A94A6] hover:text-[#E53935]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="px-4 mt-4">
            <div className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-[#5BA4CF]" />
                <span className="text-sm font-medium">Promo Code</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  className="bg-[#5BA4CF] text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                >
                  Apply
                </button>
              </div>
              {promoApplied && (
                <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                  <span>Promo applied: {promoApplied.message}</span>
                </p>
              )}
              {promoError && (
                <p className="text-[#E53935] text-xs mt-2">{promoError}</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-4 mt-4">
            <div className="bg-[#243656] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#8A94A6]">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8A94A6]">Discount</span>
                  <span className="text-green-400">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#8A94A6]">Shipping</span>
                <span className="text-[#8A94A6]">Calculated at checkout</span>
              </div>
              <div className="border-t border-[#8A94A6]/20 pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-[#D4A03C] font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0F1923] border-t border-[#243656] max-w-lg mx-auto">
            <button
              onClick={() => navigate("/checkout", { state: { promoCode: promoApplied ? promoCode : undefined, discount } })}
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Checkout &middot; ${total.toFixed(2)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
