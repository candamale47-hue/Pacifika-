import { useState } from "react";
import { X, Plus, Minus, CheckCircle, ShoppingBag, Heart, Ruler } from "lucide-react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import LazyImage from "@/components/LazyImage";
import SizeGuideModal from "@/components/SizeGuideModal";
import { trackAddToCart } from "@/lib/analytics";
import { trackPixelAddToCart } from "@/lib/fb-pixel";

interface QuickViewModalProps {
  productId: number | null;
  onClose: () => void;
}

export default function QuickViewModal({ productId, onClose }: QuickViewModalProps) {
  const { data: product, isLoading } = trpc.product.getById.useQuery(
    { id: productId! },
    { enabled: !!productId }
  );
  const { addItem } = useCart();
  const { isLiked, toggle } = useWishlist();
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  if (!productId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#D4A03C] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const effectivePrice = salePrice ?? price;

  const sizeStockMap: Record<string, number> = (product as Record<string, unknown>).sizeStock
    ? JSON.parse((product as Record<string, unknown>).sizeStock as string)
    : {};

  const getSizeStock = (size: string) => {
    if (sizeStockMap[size] !== undefined) return parseInt(String(sizeStockMap[size]));
    return product.stockQuantity;
  };

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      image: images[0] ?? "",
      size: selectedSize || "",
      color: "",
      quantity,
    });
    trackAddToCart({
      id: String(product.id),
      name: product.name,
      category: product.category,
      price: effectivePrice,
      quantity,
      size: selectedSize || undefined,
    });
    trackPixelAddToCart({
      id: String(product.id),
      name: product.name,
      category: product.category,
      price: effectivePrice,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
        >
          <X size={16} className="text-white" />
        </button>

        {/* Image */}
        <div className="aspect-square bg-[#1B2A4A] relative overflow-hidden">
          <LazyImage src={images[imgIndex] ?? ""} alt={product.name} className="w-full h-full" />
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-2 h-2 rounded-full ${i === imgIndex ? "bg-[#D4A03C]" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => toggle(product.id)}
            className="absolute top-3 right-12 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
          >
            <Heart
              size={16}
              className={isLiked(product.id) ? "text-[#E53935] fill-[#E53935]" : "text-white"}
            />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          <div>
            <p className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1">{product.category}</p>
            <h2 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{product.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[#D4A03C] font-bold text-xl">${effectivePrice.toFixed(2)}</span>
              {salePrice && (
                <span className="text-[#8A94A6] line-through">${price.toFixed(2)}</span>
              )}
              {product.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  product.badge === "new" ? "bg-[#5BA4CF]/20 text-[#5BA4CF]" :
                  product.badge === "bestseller" ? "bg-[#D4A03C]/20 text-[#D4A03C]" :
                  "bg-[#E53935]/20 text-[#E53935]"
                }`}>
                  {product.badge.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-[#8A94A6] leading-relaxed line-clamp-3">{product.description}</p>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Select Size</p>
                <button onClick={() => setShowSizeGuide(true)} className="text-xs text-[#5BA4CF] flex items-center gap-1">
                  <Ruler size={12} /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: string) => {
                  const sq = getSizeStock(s);
                  const isOut = sq === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => { if (!isOut) setSelectedSize(s); }}
                      disabled={isOut}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors relative ${
                        selectedSize === s ? "bg-[#D4A03C] text-[#1B2A4A] border-[#D4A03C]" :
                        isOut ? "bg-[#1B2A4A]/50 text-[#8A94A6]/40 border-[#8A94A6]/10 line-through" :
                        "bg-transparent text-[#F0EDE6] border-[#8A94A6]/30"
                      }`}
                    >
                      {s}
                      {sq > 0 && sq < 5 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-400 rounded-full" title={`${sq} left`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantity</span>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 bg-[#1B2A4A] rounded-lg flex items-center justify-center border border-[#8A94A6]/20">
              <Minus size={16} />
            </button>
            <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 bg-[#1B2A4A] rounded-lg flex items-center justify-center border border-[#8A94A6]/20">
              <Plus size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                added ? "bg-green-500 text-white" : "bg-[#D4A03C] text-[#1B2A4A] active:scale-[0.98]"
              }`}
            >
              {added ? (
                <><CheckCircle size={16} /> Added!</>
              ) : (
                <><ShoppingBag size={16} /> Add to Bag</>
              )}
            </button>
            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="bg-[#243656] px-5 rounded-lg text-sm font-medium flex items-center justify-center"
            >
              Details
            </Link>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.stockQuantity > 0 ? "bg-green-400" : "bg-[#E53935]"}`} />
            <span className={`text-xs font-medium ${product.stockQuantity > 0 ? "text-green-400" : "text-[#E53935]"}`}>
              {product.stockQuantity > 5 ? "In Stock" : product.stockQuantity > 0 ? `Only ${product.stockQuantity} left` : "Out of Stock"}
            </span>
          </div>
        </div>
      </div>

      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} category={product.category} />
    </div>
  );
}
