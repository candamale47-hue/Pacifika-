import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useCart } from "@/lib/cart-context";
import LazyImage from "@/components/LazyImage";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, subtotal, totalItems, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-[#1B2A4A] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#243656]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#D4A03C]" />
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Your Bag
            </h2>
            {totalItems > 0 && (
              <span className="bg-[#D4A03C] text-[#1B2A4A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 -mr-2">
            <X size={20} className="text-[#8A94A6]" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#243656] rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={28} className="text-[#8A94A6]" />
              </div>
              <p className="text-[#8A94A6] text-sm mb-1">Your bag is empty</p>
              <p className="text-[#8A94A6] text-xs">Add some island style!</p>
              <button
                onClick={() => { onClose(); navigate("/shop"); }}
                className="mt-4 bg-[#D4A03C] text-[#1B2A4A] px-6 py-2.5 rounded-lg text-sm font-semibold"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-[#243656] rounded-xl p-3">
                  {/* Image */}
                  <Link
                    to={`/product/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    onClick={onClose}
                    className="w-16 h-16 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0"
                  >
                    <LazyImage src={item.image} alt={item.name} className="w-16 h-16" />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      onClick={onClose}
                    >
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      {item.size && (
                        <p className="text-[10px] text-[#8A94A6]">Size: {item.size}</p>
                      )}
                    </Link>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 bg-[#1B2A4A] rounded flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-[#1B2A4A] rounded flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price + Remove */}
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4A03C] font-bold text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-[#8A94A6] hover:text-[#E53935]"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#243656] px-5 py-4 space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8A94A6]">Subtotal</span>
              <span className="text-lg font-bold text-[#D4A03C]">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-[#8A94A6]">
              Shipping calculated at checkout
            </p>

            {/* Checkout Button */}
            <button
              onClick={() => { onClose(); navigate("/checkout"); }}
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            >
              Checkout
              <ArrowRight size={16} />
            </button>

            {/* View Full Cart Link */}
            <button
              onClick={() => { onClose(); navigate("/cart"); }}
              className="w-full text-center text-xs text-[#8A94A6] py-1"
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
