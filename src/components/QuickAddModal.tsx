import { useState } from "react";
import { X, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { trackAddToCart } from "@/lib/analytics";
import { trackPixelAddToCart } from "@/lib/fb-pixel";

interface QuickProduct {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  sizes: string[];
  slug: string;
  category: string;
}

interface QuickAddModalProps {
  product: QuickProduct | null;
  onClose: () => void;
}

export default function QuickAddModal({ product, onClose }: QuickAddModalProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const price = product.salePrice ?? product.price;
  const image = Array.isArray(product.images) ? product.images[0] : "";

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) return;

    addItem({
      productId: product.id,
      name: product.name,
      price,
      image,
      size: selectedSize || "",
      color: "",
      quantity: 1,
    });

    trackAddToCart({
      id: String(product.id),
      name: product.name,
      category: product.category,
      price,
      quantity: 1,
      size: selectedSize || undefined,
    });
    trackPixelAddToCart({
      id: String(product.id),
      name: product.name,
      category: product.category,
      price,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setSelectedSize("");
    }, 1200);
  };

  // If no sizes needed, add instantly
  if (sizes.length === 0 && !added) {
    handleAdd();
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1B2A4A] rounded-t-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-3">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#243656] flex-shrink-0">
              <img src={image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium line-clamp-1">{product.name}</p>
              <p className="text-[#D4A03C] font-bold text-sm">${price.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 -mr-1">
            <X size={18} className="text-[#8A94A6]" />
          </button>
        </div>

        {added ? (
          <div className="px-5 pb-6 flex flex-col items-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
              <Check size={28} className="text-green-400" />
            </div>
            <p className="text-sm font-medium">Added to Bag!</p>
          </div>
        ) : (
          <>
            {/* Size Picker */}
            <div className="px-5 pb-4">
              <p className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSize === s
                        ? "bg-[#D4A03C] text-[#1B2A4A] border-[#D4A03C]"
                        : "bg-transparent text-[#F0EDE6] border-[#8A94A6]/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <div className="px-5 pb-6">
              <button
                onClick={handleAdd}
                disabled={sizes.length > 0 && !selectedSize}
                className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                Add to Bag — ${price.toFixed(2)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
