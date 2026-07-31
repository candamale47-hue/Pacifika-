import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Star, Minus, Plus, ChevronRight, ChevronLeft, Send, CheckCircle, Heart, Ruler, Bell, Package, Play, Zap } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/lib/cart-context";
import MetaTags from "@/components/MetaTags";
import { trackViewItem, trackAddToCart } from "@/lib/analytics";
import { trackPixelViewContent, trackPixelAddToCart } from "@/lib/fb-pixel";
import { useTrackProductView, trackAddToCartFunnel } from "@/lib/funnel-tracker";

/* Safe data helpers - prevent crashes from bad data */
function safeString(val: unknown): string { if (typeof val === "string") return val; if (typeof val === "number") return String(val); return ""; }
function safeNumber(val: unknown): number { if (typeof val === "number" && !isNaN(val)) return val; const p = Number(val); return !isNaN(p) ? p : 0; }
function safeArray<T>(val: unknown): T[] { return Array.isArray(val) ? val : []; }
function safeSizeStock(val: unknown): Record<string, number> { if (!val) return {}; if (typeof val === "object" && !Array.isArray(val)) return val as Record<string, number>; try { if (typeof val === "string") return JSON.parse(val); } catch { /* ignore */ } return {}; }

// Lazy-loaded heavy components (prevent them from breaking the page)
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return <div className={`${className} bg-[#1B2A4A] flex items-center justify-center text-[#8A94A6] text-xs`}>No Image</div>;
  return (
    <div className={`${className} relative overflow-hidden`}>
      {!loaded && <div className="absolute inset-0 bg-[#1B2A4A] animate-pulse" />}
      <img src={src} alt={alt} className="w-full h-full object-cover" onLoad={() => setLoaded(true)} loading="lazy" />
    </div>
  );
}

function SocialShare({ productName, productSlug }: { productName: string; productSlug: string }) {
  const shareData = { title: productName, text: `Check out ${productName}`, url: `https://pacifikawear.com.au/product/${productSlug}` };
  const handleShare = async () => {
    try { if (navigator.share) await navigator.share(shareData); } catch { /* cancelled */ }
  };
  return <button onClick={handleShare} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">🔗</button>;
}

function SizeGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[#243656] rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Size Guide</h3>
        <div className="space-y-2 text-sm text-[#F0EDE6]">
          <div className="flex justify-between border-b border-[#8A94A6]/20 pb-2"><span>S</span><span>38-40" chest</span></div>
          <div className="flex justify-between border-b border-[#8A94A6]/20 pb-2"><span>M</span><span>40-42" chest</span></div>
          <div className="flex justify-between border-b border-[#8A94A6]/20 pb-2"><span>L</span><span>42-44" chest</span></div>
          <div className="flex justify-between pb-2"><span>XL</span><span>44-46" chest</span></div>
        </div>
        <button onClick={onClose} className="mt-4 w-full bg-[#D4A03C] text-[#1B2A4A] py-2.5 rounded-lg font-semibold">Close</button>
      </div>
    </div>
  );
}


/* Safe Share Button - won't crash if navigator.share fails */
function ShareButton({ productName, productSlug }: { productName: string; productSlug: string }) {
  const handleShare = async () => {
    try { if (navigator.share) await navigator.share({ title: productName, text: `Check out ${productName}`, url: `https://pacifikawear.com.au/product/${productSlug}` }); } catch { /* cancelled */ }
  };
  return <button onClick={handleShare} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">🔗</button>;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isLiked, toggle: toggleWishlist } = useWishlist();

  // ALL hooks at top level - unconditionally called
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const { data: product, isLoading } = trpc.product.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );
  const { data: reviewsData, refetch: refetchReviews } = trpc.review.list.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: !!product?.id }
  );
  const createReview = trpc.review.create.useMutation({
    onSuccess: () => { refetchReviews(); setReviewSubmitted(true); setReviewName(""); setReviewEmail(""); setReviewRating(5); setReviewComment(""); setTimeout(() => setReviewSubmitted(false), 3000); },
    onError: (err) => setReviewError(err.message),
  });
  const subscribeWaitlist = trpc.waitlist.subscribe.useMutation({
    onSuccess: () => setNotifySubmitted(true),
  });

  // Tracking hook at top level
  useTrackProductView(product?.id ?? 0);

  // Analytics effect
  useEffect(() => {
    if (!product) return;
    const price = Number(product.price);
    const salePrice = product.salePrice ? Number(product.salePrice) : null;
    const images = Array.isArray(product.images) ? product.images : [];
    trackViewItem({ id: String(product.id), name: product.name, category: product.category, price });
    trackPixelViewContent({ id: String(product.id), name: product.name, category: product.category, price });
    addRecentlyViewed({ id: product.id, name: product.name, slug: product.slug, image: images[0] ?? "", price: salePrice ?? price, category: product.category });
  }, [product?.id]);

  // EARLY RETURNS - AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1923]">
        <div className="w-8 h-8 border-2 border-[#D4A03C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0F1923]">
        <p className="text-[#8A94A6] mb-4">Product not found</p>
        <Link to="/shop" className="text-[#D4A03C]">Back to Shop</Link>
      </div>
    );
  }

  // Derived values
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const reviews = reviewsData?.reviews ?? [];
  const avgRating = reviewsData?.averageRating ?? 0;
  const allMedia = [...images];
  const sizeStockMap = (() => { try { return (product as Record<string, unknown>).sizeStock ? JSON.parse((product as Record<string, unknown>).sizeStock as string) : {}; } catch { return {}; } })();
  const effectiveStock = selectedSize && sizeStockMap[selectedSize] !== undefined ? parseInt(String(sizeStockMap[selectedSize])) : product.stockQuantity;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) return;
    addItem({ productId: product.id, name: product.name, price: salePrice ?? price, image: images[0] ?? "", size: selectedSize || "", color: "", quantity });
    trackAddToCart({ id: String(product.id), name: product.name, category: product.category, price: salePrice ?? price, quantity, size: selectedSize || undefined });
    trackPixelAddToCart({ id: String(product.id), name: product.name, category: product.category, price: salePrice ?? price, quantity });
    trackAddToCartFunnel(product.id, (salePrice ?? price) * quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (sizes.length > 0 && !selectedSize) return;
    addItem({ productId: product.id, name: product.name, price: salePrice ?? price, image: images[0] ?? "", size: selectedSize || "", color: "", quantity });
    navigate("/checkout");
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    if (!reviewName.trim() || !reviewEmail.trim() || !reviewComment.trim()) return;
    createReview.mutate({ productId: product.id, userName: reviewName.trim(), email: reviewEmail.trim(), rating: reviewRating, comment: reviewComment.trim() });
  };

  return (
    <div className="pb-4 min-h-screen bg-[#0F1923]">
      <MetaTags title={product.name} description={product.description ?? undefined} image={images[0]} type="product" price={salePrice ?? price} />
      
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-square bg-[#1B2A4A] relative overflow-hidden">
          <LazyImage src={images[imgIndex] ?? ""} alt={product.name} className="w-full h-full" />
          {allMedia.length > 1 && (
            <>
              <button onClick={() => setImgIndex((i) => (i - 1 + allMedia.length) % allMedia.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center">
                <ChevronLeft size={20} className="text-white" />
              </button>
              <button onClick={() => setImgIndex((i) => (i + 1) % allMedia.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center">
                <ChevronRight size={20} className="text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allMedia.map((_, i) => (
                  <button key={i} onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full ${i === imgIndex ? "bg-[#D4A03C]" : "bg-white/40"}`} />
                ))}
n              </div>
            </>
          )}
        </div>
        
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 mt-2 overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button key={i} onClick={() => setImgIndex(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === imgIndex ? "border-[#D4A03C]" : "border-transparent"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        
        {/* Top buttons */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <ArrowLeft size={18} className="text-[#1B2A4A]" />
        </button>
        <button onClick={() => toggleWishlist(product.id)} className="absolute top-4 right-14 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Heart size={16} className={isLiked(product.id) ? "text-[#E53935] fill-[#E53935]" : "text-[#1B2A4A]"} />
        </button>
        <div className="absolute top-4 right-4">
          <SocialShare productName={product.name} productSlug={product.slug} />
        </div>
      </div>

      {/* Product Info Card */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-[#243656] rounded-t-3xl rounded-b-xl p-5">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>{product.name}</h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[#D4A03C] font-bold text-xl">${(salePrice ?? price).toFixed(2)}</span>
            {salePrice && <span className="text-[#8A94A6] line-through text-sm">${price.toFixed(2)}</span>}
          </div>
          <p className="text-[#8A94A6] text-sm leading-relaxed mb-5">{product.description}</p>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Select Size</p>
                <button onClick={() => setShowSizeGuide(true)} className="text-xs text-[#5BA4CF] flex items-center gap-1">
                  <Ruler size={12} /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: string) => {
                  const sizeQty = sizeStockMap[s] !== undefined ? parseInt(String(sizeStockMap[s])) : product.stockQuantity;
                  const isOutOfStock = sizeQty === 0;
                  return (
                    <button key={s} onClick={() => { if (!isOutOfStock) setSelectedSize(s); }} disabled={isOutOfStock}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedSize === s ? "bg-[#D4A03C] text-[#1B2A4A] border-[#D4A03C]" : isOutOfStock ? "bg-[#1B2A4A]/50 text-[#8A94A6]/40 border-[#8A94A6]/10 line-through" : "bg-transparent text-[#F0EDE6] border-[#8A94A6]/30"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5">
            <p className="text-sm font-medium mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 bg-[#1B2A4A] rounded-lg flex items-center justify-center border border-[#8A94A6]/20"><Minus size={16} /></button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 bg-[#1B2A4A] rounded-lg flex items-center justify-center border border-[#8A94A6]/20"><Plus size={16} /></button>
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className={effectiveStock > 0 ? "text-green-400" : "text-[#E53935]"} />
            <span className={`text-xs font-medium ${effectiveStock > 0 ? "text-green-400" : "text-[#E53935]"}`}>
              {effectiveStock > 5 ? "In Stock" : effectiveStock > 0 ? `Only ${effectiveStock} left` : "Out of Stock"}
            </span>
          </div>

          {/* CTA Buttons: Add to Bag + Buy Now */}
          {effectiveStock === 0 ? (
            <div className="bg-[#243656] rounded-xl p-4">
              {notifySubmitted ? (
                <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={16} /> We'll email you when this is back in stock!</div>
              ) : (
                <>
                  <p className="text-xs text-[#8A94A6] mb-2">Get notified when this item is back in stock</p>
                  <div className="flex gap-2">
                    <input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="Your email" className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-xs border border-transparent focus:border-[#D4A03C] outline-none" />
                    <button onClick={() => { if (!notifyEmail.trim() || !notifyEmail.includes("@")) return; subscribeWaitlist.mutate({ email: notifyEmail.trim(), productId: product.id }); }} disabled={subscribeWaitlist.isPending} className="bg-[#D4A03C] text-[#1B2A4A] px-4 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                      <Bell size={12} /> Notify Me
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleAddToCart} className={`py-3.5 rounded-lg font-semibold text-sm transition-all ${added ? "bg-green-500 text-white" : "bg-[#D4A03C] text-[#1B2A4A] active:scale-[0.98]"}`}>
                {added ? "Added!" : "Add to Bag"}
              </button>
              <button onClick={handleBuyNow} disabled={sizes.length > 0 && !selectedSize} className="py-3.5 rounded-lg font-semibold text-sm bg-[#5BA4CF] text-white active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                <Zap size={16} />
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="px-4 mt-6">
        <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>Reviews</h3>
        <div className="bg-[#243656] rounded-xl p-4 mb-4">
          <h4 className="text-sm font-medium mb-3">Write a Review</h4>
          {reviewSubmitted ? (
            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={16} /> Review submitted! Thank you.</div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              {reviewError && <p className="text-[#E53935] text-xs">{reviewError}</p>}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8A94A6]">Rating:</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewRating(s)}>
                      <Star size={20} className={s <= reviewRating ? "text-[#D4A03C] fill-[#D4A03C]" : "text-[#8A94A6]"} />
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Your Name *" required value={reviewName} onChange={e => setReviewName(e.target.value)} className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
              <input type="email" placeholder="Email *" required value={reviewEmail} onChange={e => setReviewEmail(e.target.value)} className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
              <textarea placeholder="Your review... *" required rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none" />
              <button type="submit" disabled={createReview.isPending} className="bg-[#5BA4CF] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 w-full disabled:opacity-50">
                <Send size={14} /> {createReview.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= review.rating ? "text-[#D4A03C] fill-[#D4A03C]" : "text-[#8A94A6]"} />)}
                </div>
                <span className="text-xs font-medium">{review.userName}</span>
              </div>
              <p className="text-sm text-[#F0EDE6]/80">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      {/* Related Products */}
      <div className="px-4 mt-6 pb-6">
        <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>You May Also Like</h3>
        <RelatedProducts currentId={product.id} category={product.category} />
      </div>
    </div>
  );
}

function RelatedProducts({ currentId, category }: { currentId: number; category: string }) {
  const { data: relatedData } = trpc.product.getRelated.useQuery({ id: currentId });
  const { data: fallbackData } = trpc.product.list.useQuery(
    { category, limit: 5 },
    { enabled: !relatedData || relatedData.length === 0 }
  );
  let related = relatedData ?? [];
  if (related.length === 0 && fallbackData) {
    related = fallbackData.products.filter((p) => p.id !== currentId).slice(0, 4);
  }
  if (related.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {related.map((p) => (
        <Link key={p.id} to={`/product/${p.slug}`} className="min-w-[140px] bg-[#1B2A4A] rounded-xl overflow-hidden flex-shrink-0">
          <img src={Array.isArray(p.images) ? p.images[0] : ""} alt={p.name} className="w-[140px] h-[140px] object-cover" loading="lazy" />
          <div className="p-2.5">
            <p className="text-[11px] text-[#F0EDE6] line-clamp-2 font-medium leading-tight">{p.name}</p>
            <p className="text-[#D4A03C] font-bold text-xs mt-1">${Number(p.price).toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
