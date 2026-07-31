import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Search, SlidersHorizontal, X, Heart, Clock, ArrowUpDown } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { trpc } from "@/providers/trpc";
import LazyImage from "@/components/LazyImage";
import QuickViewModal from "@/components/QuickViewModal";
import { trackSearch } from "@/lib/analytics";
import { useTrackShopView, trackAddToCartFunnel } from "@/lib/funnel-tracker";
import { seedProducts } from "@/data/seed";

const categoryTabs = [
  { label: "All", value: "all" },
  { label: "Dresses", value: "dresses" },
  { label: "Shirts", value: "shirts" },
  { label: "Family Sets", value: "puletasi" },
  { label: "Kids", value: "kids" },
];

const validCategories = new Set(categoryTabs.map((t) => t.value));

export default function Shop() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  // Category comes from the URL so back/forward keeps the selected tab
  const activeCategory =
    category && validCategories.has(category) ? category : "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const { isLiked, toggle } = useWishlist();
  const [recentlyViewed] = useState(() => getRecentlyViewed());
  const [quickViewId, setQuickViewId] = useState<number | null>(null);

  const selectCategory = (value: string) => {
    navigate(value === "all" ? "/shop" : `/shop/${value}`);
  };

  const { data, isLoading } = trpc.product.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
    search: searchQuery || undefined,
    sort,
    limit: 50,
  });

  // Real DB products win. If empty (e.g. Family Sets), show the same
  // original dummy list as before until admin adds real products.
  const products = useMemo(() => {
    const apiProducts = data?.products ?? [];
    if (apiProducts.length > 0) return apiProducts;
    if (searchQuery.trim()) return [];
    return seedProducts;
  }, [data?.products, searchQuery]);

  // Track shop view
  useTrackShopView();

  // Track search after debounce
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      trackSearch(searchQuery);
    }, 1000);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>Shop</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2">
              <Search size={18} className="text-[#F0EDE6]" />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="p-2">
              <SlidersHorizontal size={18} className="text-[#F0EDE6]" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#243656] text-[#F0EDE6] rounded-lg pl-9 pr-8 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              autoFocus
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-[#8A94A6]" />
              </button>
            )}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => selectCategory(tab.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === tab.value
                  ? "bg-[#D4A03C] text-[#1B2A4A]"
                  : "bg-[#243656] text-[#F0EDE6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        {showFilters && (
          <div className="mt-2 p-3 bg-[#243656] rounded-lg">
            <p className="text-xs text-[#8A94A6] mb-2">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Newest", value: "newest" },
                { label: "Price: Low-High", value: "price-asc" },
                { label: "Price: High-Low", value: "price-desc" },
                { label: "Name A-Z", value: "name" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setShowFilters(false); }}
                  className={`px-3 py-1 rounded-full text-xs ${
                    sort === opt.value ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#1B2A4A] text-[#8A94A6]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="px-4 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#5BA4CF]" />
            <h2 className="text-sm font-semibold">Recently Viewed</h2>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="min-w-[80px] max-w-[80px] flex-shrink-0"
              >
                <div className="w-[80px] h-[80px] rounded-lg overflow-hidden bg-[#1B2A4A]">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-[#F0EDE6] line-clamp-1 mt-1 font-medium">{item.name}</p>
                <p className="text-[10px] text-[#D4A03C] font-bold">${item.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results Bar */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <p className="text-xs text-[#8A94A6]">{products.length} result{products.length !== 1 ? "s" : ""}</p>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-[#1B2A4A] text-[#8A94A6] pl-3 pr-7 py-1.5 rounded-full text-xs border border-transparent focus:border-[#D4A03C] outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
          <ArrowUpDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-3 pt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#1B2A4A] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-[#243656]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#243656] rounded w-3/4" />
                  <div className="h-3 bg-[#243656] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search size={48} className="text-[#8A94A6] mb-4" />
            <p className="text-[#8A94A6] text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => {
              const isPreview = product.id < 0;
              const cardInner = (
                <>
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <LazyImage
                      src={Array.isArray(product.images) ? product.images[0] : ""}
                      alt={product.name}
                      className="w-full h-full"
                    />
                    {isPreview && (
                      <span className="absolute top-2 left-2 bg-[#8A94A6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PREVIEW
                      </span>
                    )}
                    {!isPreview && product.salePrice && (
                      <span className="absolute top-2 left-2 bg-[#E53935] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        SALE
                      </span>
                    )}
                    {!isPreview && product.badge && (
                      <span className={`absolute ${product.salePrice ? "top-7" : "top-2"} left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.badge === "new" ? "bg-[#5BA4CF] text-white" :
                        product.badge === "bestseller" ? "bg-[#D4A03C] text-[#1B2A4A]" :
                        "bg-[#E53935]/80 text-white"
                      }`}>
                        {product.badge === "new" ? "NEW" : product.badge === "bestseller" ? "BEST" : "LIMITED"}
                      </span>
                    )}
                    {!isPreview && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewId(product.id);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-[#D4A03C] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      >
                        <span className="text-[#1B2A4A] text-lg font-bold leading-none">+</span>
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#F0EDE6] line-clamp-2 font-medium leading-tight min-h-[2rem]">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#D4A03C] font-bold text-sm">${Number(product.price).toFixed(2)}</span>
                      {!isPreview && product.salePrice && (
                        <span className="text-[#8A94A6] text-xs line-through">
                          ${Number(product.salePrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              return (
                <div
                  key={product.id}
                  className="bg-[#1B2A4A] rounded-xl overflow-hidden group relative"
                >
                  {isPreview ? (
                    <div className="cursor-default">{cardInner}</div>
                  ) : (
                    <Link to={`/product/${product.slug}`}>{cardInner}</Link>
                  )}
                  {!isPreview && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Heart
                        size={16}
                        className={isLiked(product.id) ? "text-[#E53935] fill-[#E53935]" : "text-white"}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        productId={quickViewId}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}
