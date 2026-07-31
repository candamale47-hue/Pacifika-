import { useNavigate } from "react-router";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { trpc } from "@/providers/trpc";
import LazyImage from "@/components/LazyImage";
import NewsletterBanner from "@/components/NewsletterBanner";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { likedIds, toggle } = useWishlist();
  const { addItem } = useCart();
  const { data: products } = trpc.product.list.useQuery({ limit: 100 });

  const wishlistProducts = (products?.products ?? []).filter((p) => likedIds.has(p.id));

  const handleAddToBag = (product: (typeof wishlistProducts)[0]) => {
    const size = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined;
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: Array.isArray(product.images) ? product.images[0] : "",
      size: size ?? "",
      color: "",
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          My Wishlist
        </h1>
        <span className="text-xs text-[#8A94A6] ml-auto">{wishlistProducts.length} items</span>
      </header>

      {wishlistProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 pt-20">
          <div className="w-20 h-20 bg-[#243656] rounded-full flex items-center justify-center mb-4">
            <Heart size={32} className="text-[#8A94A6]" />
          </div>
          <p className="text-[#8A94A6] mb-2 text-center">Your wishlist is empty</p>
          <p className="text-xs text-[#8A94A6] text-center mb-6">
            Tap the heart on any product to save it here
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-[#D4A03C] text-[#1B2A4A] px-8 py-3 rounded-lg font-semibold text-sm"
          >
            Browse Products
          </button>
          <div className="w-full mt-8">
            <NewsletterBanner variant="inline" />
          </div>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#243656] rounded-xl overflow-hidden flex"
            >
              {/* Image */}
              <button
                onClick={() => navigate(`/product/${product.slug}`)}
                className="w-28 h-28 flex-shrink-0 relative"
              >
                <LazyImage
                  src={Array.isArray(product.images) ? product.images[0] : ""}
                  alt={product.name}
                  className="w-28 h-28"
                />
              </button>

              {/* Content */}
              <div className="flex-1 p-3 flex flex-col min-w-0">
                <button
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="text-left"
                >
                  <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-[#D4A03C] font-bold mt-0.5">
                    ${Number(product.price).toFixed(2)}
                    {product.salePrice && (
                      <span className="text-[#8A94A6] line-through ml-1.5 font-normal">
                        ${Number(product.salePrice).toFixed(2)}
                      </span>
                    )}
                  </p>
                  {product.stockQuantity === 0 && (
                    <p className="text-[10px] text-[#E53935] mt-1">Out of Stock</p>
                  )}
                  {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                    <p className="text-[10px] text-orange-400 mt-1">Only {product.stockQuantity} left</p>
                  )}
                </button>

                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => handleAddToBag(product)}
                    disabled={product.stockQuantity === 0}
                    className="flex-1 bg-[#D4A03C] text-[#1B2A4A] py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ShoppingBag size={12} />
                    Add to Bag
                  </button>
                  <button
                    onClick={() => toggle(product.id)}
                    className="p-2 text-[#E53935]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <NewsletterBanner variant="inline" />
          </div>
        </div>
      )}
    </div>
  );
}
