import { Link, useLocation } from "react-router";
import { Home, LayoutGrid, ShoppingBag, User, Heart, Camera } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

const linkItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/lookbook", icon: Camera, label: "Lookbook" },
  { path: "/shop", icon: LayoutGrid, label: "Shop" },
  { path: "/account", icon: User, label: "Menu" },
];

interface BottomNavProps {
  onOpenCart: () => void;
}

export default function BottomNav({ onOpenCart }: BottomNavProps) {
  const location = useLocation();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const hiddenPaths = ["/checkout", "/login", "/admin", "/track", "/terms", "/privacy", "/returns", "/contact", "/orders", "/order-confirmation", "/forgot-password", "/reset-password"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
      <div className="h-16 bg-[#D4A03C] flex items-center justify-around px-2">
        {linkItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-14 h-14 relative"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={active ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "text-white/70"}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {item.path === "/wishlist" && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#E53935] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-semibold tracking-wide ${
                  active ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "text-white/70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Bag Button - opens mini cart */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-14 h-14 relative"
        >
          <div className="relative">
            <ShoppingBag
              size={22}
              className={isActive("/cart") ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "text-white/70"}
              strokeWidth={isActive("/cart") ? 2.5 : 1.5}
            />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#E53935] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] mt-0.5 font-semibold tracking-wide ${
              isActive("/cart") ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "text-white/70"
            }`}
          >
            Bag
          </span>
        </button>
      </div>
      <div className="h-safe-area-inset-bottom bg-[#D4A03C]" />
    </nav>
  );
}
