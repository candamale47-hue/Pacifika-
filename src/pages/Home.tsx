import { Link } from "react-router";
import { Search, Bell, Clock, Heart } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useWishlist } from "@/lib/wishlist-context";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import LazyImage from "@/components/LazyImage";
import AbandonedCartModal, { CartReminderBanner } from "@/components/AbandonedCartModal";
import NewsletterBanner from "@/components/NewsletterBanner";

const categories = [
  { name: "Island Dresses", slug: "dresses", image: "/images/category-dresses.jpg" },
  { name: "Shirts", slug: "shirts", image: "/images/category-shirts.jpg" },
  { name: "Family Sets", slug: "puletasi", image: "/images/category-puletasi.jpg" },
  { name: "Kids", slug: "kids", image: "/images/category-kids.jpg" },
];

export default function Home() {
  const { data: featuredData } = trpc.product.list.useQuery({ featured: true, limit: 6 });
  const featured = featuredData?.products ?? [];
  const { data: collectionsData } = trpc.collection.list.useQuery();
  const activeCollections = collectionsData ?? [];
  const { isLiked, toggle } = useWishlist();
  const recentlyViewed = getRecentlyViewed();

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1923]/90 backdrop-blur-md px-4 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Pacifika Wear" className="h-10 w-auto object-contain" />
          <div className="hidden sm:block">
            <p className="text-[10px] text-[#D4A03C] font-medium tracking-wider leading-tight">Culture in</p>
            <p className="text-[10px] text-[#D4A03C] font-medium tracking-wider leading-tight">every thread</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/shop" className="p-2">
            <Search size={20} className="text-[#F0EDE6]" />
          </Link>
          <button className="p-2 relative">
            <Bell size={20} className="text-[#F0EDE6]" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-72 w-full overflow-hidden">
        <LazyImage
          src="/images/hero-banner.jpg"
          alt="Pacific Island Fashion"
          className="w-full h-full"
        />
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-[#0F1923]/40 to-[#0F1923]/15" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0F1923]/80 to-transparent" />
        <div className="absolute bottom-6 left-4 right-4">
          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{
              fontFamily: "Poppins, sans-serif",
              textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)",
            }}
          >
            PACIFIC ISLAND FASHION
          </h2>
          <p
            className="text-white text-sm font-medium mb-4"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2)" }}
          >
            Handcrafted island dresses, shirts & more
          </p>
          <Link
            to="/shop"
            className="block w-full bg-[#D4A03C] text-[#1B2A4A] text-center font-semibold py-3 rounded-lg text-sm shadow-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Cart Reminder Banner */}
      <CartReminderBanner />

      {/* Category Quick Links */}
      <section className="px-4 py-6">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop/${cat.slug}`}
              className="flex flex-col items-center min-w-[72px]"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4A03C]/30 shadow-[0_0_12px_rgba(212,160,60,0.15)]">
                <LazyImage src={cat.image} alt={cat.name} className="w-full h-full" />
              </div>
              <span
                className="text-xs mt-2 text-white text-center leading-tight font-medium"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5), 0 0 10px rgba(212,160,60,0.2)" }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>Featured</h3>
          <Link to="/shop" className="text-[#5BA4CF] text-sm">See All &rarr;</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {featured.map((product) => (
            <div key={product.id} className="min-w-[160px] bg-[#1B2A4A] rounded-xl overflow-hidden flex-shrink-0 relative">
              <Link to={`/product/${product.slug}`}>
                <LazyImage
                  src={Array.isArray(product.images) ? product.images[0] : ""}
                  alt={product.name}
                  className="w-[160px] h-[160px]"
                />
                <div className="p-3">
                  <p className="text-xs text-[#F0EDE6] line-clamp-2 font-medium leading-tight">{product.name}</p>
                  <p className="text-[#D4A03C] font-bold text-sm mt-1">${Number(product.price).toFixed(2)}</p>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <Heart
                  size={14}
                  className={isLiked(product.id) ? "text-[#E53935] fill-[#E53935]" : "text-white"}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      {activeCollections.length > 0 && activeCollections.map((collection) => (
        <CollectionSection key={collection.id} collection={collection} />
      ))}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#5BA4CF]" />
            <h3 className="text-sm font-semibold">Recently Viewed</h3>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {recentlyViewed.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="min-w-[90px] max-w-[90px] flex-shrink-0 relative"
              >
                <div className="w-[90px] h-[90px] rounded-lg overflow-hidden bg-[#1B2A4A]">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-[#F0EDE6] line-clamp-1 mt-1 font-medium">{item.name}</p>
                <p className="text-[10px] text-[#D4A03C] font-bold">${item.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Banner */}
      <section className="px-4 py-2">
        <NewsletterBanner variant="banner" />
      </section>

      {/* New Arrivals Banner */}
      <section className="px-4 py-4">
        <div className="bg-gradient-to-r from-[#243656] to-[#1B2A4A] rounded-xl p-5 border border-[#D4A03C]/20">
          <p className="text-[#D4A03C] text-xs font-semibold uppercase tracking-wider mb-1">New Arrivals</p>
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            New Arrivals to Go on Sale at the Cairns Show
          </h3>
          <p className="text-[#8A94A6] text-sm mb-3">Place your order now and pick-up at the Showground.</p>
          <Link
            to="/shop"
            className="inline-block bg-[#5BA4CF] text-white text-sm font-medium px-5 py-2 rounded-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Footer Info */}
      <section className="px-4 pt-4 pb-2">
        <NewsletterBanner variant="footer" />
      </section>
      <section className="px-4 py-6 text-center">
        <p className="text-[#8A94A6] text-xs">Cairns, QLD &bull; Free local delivery</p>
        <div className="flex justify-center gap-4 mt-3">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#8A94A6] hover:text-[#5BA4CF] text-xs">
            Facebook
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#8A94A6] hover:text-[#5BA4CF] text-xs">
            Instagram
          </a>
          <a href="mailto:joelandamale@gmail.com" className="text-[#8A94A6] hover:text-[#5BA4CF] text-xs">
            Contact
          </a>
        </div>
      </section>

      {/* Abandoned Cart Recovery Modal */}
      <AbandonedCartModal />
    </div>
  );
}

/* ─── Collection Section ─── */
function CollectionSection({ collection }: { collection: { id: number; name: string; slug: string; description: string | null; image: string | null; productCount: number } }) {
  const { data } = trpc.collection.getBySlug.useQuery({ slug: collection.slug });
  const items = data?.products ?? [];
  const { isLiked, toggle } = useWishlist();

  if (items.length === 0) return null;

  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>{collection.name}</h3>
          {collection.description && <p className="text-xs text-[#8A94A6] mt-0.5">{collection.description}</p>}
        </div>
        <Link to={`/shop`} className="text-[#5BA4CF] text-sm">See All &rarr;</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {items.map((product) => (
          <div key={product.id} className="min-w-[160px] bg-[#1B2A4A] rounded-xl overflow-hidden flex-shrink-0 relative">
            <Link to={`/product/${product.slug}`}>
              <LazyImage
                src={Array.isArray(product.images) ? product.images[0] : ""}
                alt={product.name}
                className="w-[160px] h-[160px]"
              />
              <div className="p-3">
                <p className="text-xs text-[#F0EDE6] line-clamp-2 font-medium leading-tight">{product.name}</p>
                <p className="text-[#D4A03C] font-bold text-sm mt-1">${Number(product.price).toFixed(2)}</p>
              </div>
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Heart
                size={14}
                className={isLiked(product.id) ? "text-[#E53935] fill-[#E53935]" : "text-white"}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}