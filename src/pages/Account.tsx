import { Link } from "react-router";
import {
  Package, Star, MapPin, Tag, Settings, HelpCircle,
  LogOut, ChevronRight, Shield, MessageSquare, Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";

const menuItems = [
  { icon: Package, label: "My Orders", path: "/orders" },
  { icon: Heart, label: "My Wishlist", path: "/wishlist" },
  { icon: Star, label: "My Reviews", path: "/orders" },
  { icon: MapPin, label: "Addresses", path: "/orders" },
  { icon: Tag, label: "Promo Codes", path: "/shop" },
  { icon: Settings, label: "Settings", path: "/account" },
  { icon: HelpCircle, label: "Help & Support", path: "/contact" },
  { icon: MessageSquare, label: "Contact Us", path: "/contact" },
];

export default function Account() {
  const { user, isLoading, logout, isAdmin, isLoggedIn } = useAuth();
  const { data: myOrdersData } = trpc.localAuth.myOrders.useQuery(
    { limit: 5 },
    { enabled: isLoggedIn }
  );
  const recentOrders = myOrdersData?.orders ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A03C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="px-4 py-4">
        <h1 className="text-xl font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>My Account</h1>
      </header>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="bg-[#243656] rounded-xl p-5 flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A03C] to-[#5BA4CF] flex items-center justify-center text-[#1B2A4A] font-bold text-xl">
              {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.name || "Guest User"}</p>
            <p className="text-[#8A94A6] text-sm truncate">
              {isLoggedIn ? (user?.email || "Local Account") : "Sign in to access your account"}
            </p>
            {isAdmin && (
              <span className="inline-block mt-1 text-[10px] bg-[#D4A03C]/20 text-[#D4A03C] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
                Admin
              </span>
            )}
          </div>
          {isAdmin && (
            <Link to="/admin" className="p-2 bg-[#D4A03C]/20 rounded-lg">
              <Shield size={18} className="text-[#D4A03C]" />
            </Link>
          )}
        </div>
      </div>

      {isLoggedIn ? (
        <>
          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div className="px-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Recent Orders</h2>
                <Link to="/orders" className="text-xs text-[#5BA4CF]">View All</Link>
              </div>
              <div className="space-y-2">
                {recentOrders.slice(0, 3).map((order) => (
                  <Link
                    key={order.id}
                    to={`/track?order=${order.orderNumber}&email=${order.shippingEmail}`}
                    className="bg-[#243656] rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-mono text-[#D4A03C]">{order.orderNumber}</p>
                      <p className="text-[10px] text-[#8A94A6] mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">${Number(order.total).toFixed(2)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        order.status === "delivered" ? "bg-green-500/20 text-green-400" :
                        order.status === "shipped" ? "bg-sky-500/20 text-sky-400" :
                        order.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {order.status?.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Menu List */}
          <div className="px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-4 bg-[#243656] rounded-xl px-4 py-3.5"
                >
                  <Icon size={20} className="text-[#D4A03C]" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <ChevronRight size={16} className="text-[#8A94A6]" />
                </Link>
              );
            })}
          </div>

          {/* Legal Links */}
          <div className="px-4 mt-6 space-y-3">
            <p className="text-xs text-[#8A94A6] uppercase tracking-wider px-1">Legal</p>
            <div className="space-y-1">
              <Link to="/terms" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Terms of Service</Link>
              <Link to="/privacy" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Privacy Policy</Link>
              <Link to="/returns" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Return & Refund Policy</Link>
            </div>
          </div>

          {/* Logout */}
          <div className="px-4 mt-6">
            <button
              onClick={logout}
              className="flex items-center gap-4 text-[#E53935] px-1 py-3"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 mt-4">
          <Link
            to="/login"
            className="block w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm text-center"
          >
            Sign In
          </Link>
          <Link
            to="/contact"
            className="block w-full mt-3 border border-[#243656] text-[#F0EDE6] py-3 rounded-lg text-sm text-center"
          >
            Contact Us
          </Link>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-[#8A94A6] uppercase tracking-wider px-1">Legal</p>
            <div className="space-y-1">
              <Link to="/terms" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Terms of Service</Link>
              <Link to="/privacy" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Privacy Policy</Link>
              <Link to="/returns" className="block px-1 py-2 text-sm text-[#8A94A6] hover:text-[#F0EDE6]">Return & Refund Policy</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
