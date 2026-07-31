import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, LogOut, TrendingUp, ShoppingBag, AlertTriangle,
  Search, Trash2, Package, Tag, BarChart3, Plus, Edit2,
  BarChart, Download, Upload, Copy, Settings, Store, CheckCircle, Star, Eye, EyeOff, X,
  CheckSquare, Square, ArrowUpDown, Bell, FileText, Users, Warehouse, Loader2, LayoutGrid,
  PieChart, UserCheck, MessageSquare, Filter, ShoppingCart, Camera,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import ProductFormModal from "@/components/ProductFormModal";
import SalesChart from "@/components/SalesChart";
import ReportsTab from "@/components/ReportsTab";
import LazyImage from "@/components/LazyImage";
import { trackAdminLogin } from "@/lib/analytics";
import { productsToCSV, parseCSV, downloadCSV, ordersToCSV, type ProductCSVRow, type OrderCSVRow } from "@/lib/csv";

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400",
  received: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-sky-500/20 text-sky-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-[#E53935]/20 text-[#E53935]",
};

const ADMIN_USERNAME = "Andamamle1";
const ADMIN_PASSWORD = "JMA@2008";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("pw_admin_auth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "promos" | "analytics" | "store" | "reviews" | "waitlist" | "reports" | "customers" | "inventory" | "collections" | "revenue" | "funnel" | "lookbook">("dashboard");
  const [lastOrdersView, setLastOrdersView] = useState<number>(() => {
    return parseInt(localStorage.getItem("pw_admin_orders_view") ?? "0");
  });

  // Fetch orders for notification badge (only when logged in)
  const { data: ordersData } = trpc.order.getAdminList.useQuery(
    {},
    { enabled: isLoggedIn }
  );
  const newOrdersCount = (ordersData?.orders ?? []).filter(
    (o) => o.createdAt && new Date(o.createdAt).getTime() > lastOrdersView
  ).length;

  useEffect(() => {
    if (isLoggedIn) trackAdminLogin();
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("pw_admin_auth", "true");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pw_admin_auth");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  // Handle tab click with orders notification
  const handleTabClick = (key: string) => {
    if (key === "orders") {
      const now = Date.now();
      localStorage.setItem("pw_admin_orders_view", String(now));
      setLastOrdersView(now);
    }
    setActiveTab(key as typeof activeTab);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#243656] rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <img src="/logo.png" alt="Pacifika Wear" className="h-16 w-auto mx-auto mb-3" />
            <h1 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Admin Login</h1>
            <p className="text-xs text-[#8A94A6] mt-1">Pacifika Wear Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
            {loginError && (
              <p className="text-xs text-[#E53935] bg-[#E53935]/10 rounded-lg p-2">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm"
            >
              Sign In
            </button>
          </form>

          <Link to="/" className="block text-center text-xs text-[#8A94A6] hover:text-[#5BA4CF]">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/account" className="p-1">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>Admin</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-[#8A94A6] hover:text-[#E53935] px-2 py-1"
        >
          <LogOut size={14} /> Exit
        </button>
      </header>

      <nav className="px-4 mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {([
          { key: "funnel" as const, icon: Filter, label: "Funnel" },
          { key: "dashboard" as const, icon: BarChart3, label: "Dashboard" },
          { key: "products" as const, icon: Package, label: "Products" },
          { key: "inventory" as const, icon: Warehouse, label: "Inventory" },
          { key: "orders" as const, icon: ShoppingBag, label: "Orders" },
          { key: "customers" as const, icon: Users, label: "Customers" },
          { key: "collections" as const, icon: Package, label: "Collections" },
          { key: "lookbook" as const, icon: Camera, label: "Lookbook" },
          { key: "promos" as const, icon: Tag, label: "Promos" },
          { key: "reviews" as const, icon: Star, label: "Reviews" },
          { key: "waitlist" as const, icon: Bell, label: "Waitlist" },
          { key: "revenue" as const, icon: BarChart, label: "Revenue" },
          { key: "analytics" as const, icon: BarChart, label: "Analytics" },
          { key: "reports" as const, icon: FileText, label: "Reports" },
          { key: "store" as const, icon: Store, label: "Store" },
        ]).map((tab) => {
          const Icon = tab.icon;
          const hasNewOrders = tab.key === "orders" && newOrdersCount > 0;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap relative ${
                activeTab === tab.key ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {hasNewOrders && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E53935] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {newOrdersCount > 9 ? "9+" : newOrdersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 mt-4">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "customers" && <CustomersTab />}
        {activeTab === "promos" && <PromosTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "waitlist" && <WaitlistTab />}
        {activeTab === "collections" && <CollectionsTab />}
        {activeTab === "revenue" && <RevenueTab />}
        {activeTab === "funnel" && <FunnelTab />}
        {activeTab === "lookbook" && <LookbookAdminTab />}
        {activeTab === "analytics" && <AnalyticsSettingsTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "store" && <StoreSettingsTab />}
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab() {
  const { data: analyticsData, isLoading: analyticsLoading } = trpc.analytics.dashboard.useQuery();
  const { data: chartData, isLoading: chartLoading } = trpc.order.chartData.useQuery({ days: 30 });

  const isLoading = analyticsLoading || chartLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#243656] rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-[#243656] rounded-xl p-4 h-56 animate-pulse" />
        <div className="bg-[#243656] rounded-xl p-4 h-56 animate-pulse" />
      </div>
    );
  }

  const stats = [
    { label: "30-Day Revenue", value: `$${(chartData?.summary.totalRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-[#D4A03C]" },
    { label: "30-Day Orders", value: String(chartData?.summary.totalOrders ?? 0), icon: ShoppingBag, color: "text-[#5BA4CF]" },
    { label: "Avg Order", value: `$${(chartData?.summary.avgOrderValue ?? 0).toFixed(2)}`, icon: BarChart, color: "text-green-400" },
    { label: "Low Stock", value: String(analyticsData?.lowStockCount ?? 0), icon: AlertTriangle, color: "text-[#E53935]" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={s.color} />
                <span className="text-xs text-[#8A94A6]">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {chartData && (
        <>
          <SalesChart data={chartData.daily} type="revenue" />
          <SalesChart data={chartData.daily} type="orders" />
        </>
      )}

      {/* Top Products */}
      {chartData && chartData.topProducts.length > 0 && (
        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Top Products (30 Days)</h3>
          <div className="space-y-2">
            {chartData.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#D4A03C] font-bold w-4">{i + 1}</span>
                  <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#8A94A6]">x{p.quantity}</span>
                  <span className="text-xs font-bold text-[#D4A03C]">${p.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type EditProductType = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: "dresses" | "shirts" | "puletasi" | "kids";
  price: number;
  salePrice: number | null;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[] | null;
  stockQuantity: number;
  sku: string | null;
  weightGrams: number | null;
  featured: boolean | null;
  isActive: boolean | null;
  badge: "new" | "bestseller" | "limited" | null;
};

/* ─── Products (Full CRUD + Inventory Alerts) ─── */
type StockFilter = "all" | "low" | "out" | "in";
type BadgeFilter = "all" | "new" | "bestseller" | "limited" | "none";

function ProductsTab() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<EditProductType | null>(null);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "yes" | "no">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "yes" | "no">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, refetch } = trpc.product.list.useQuery(
    { search: search || undefined, limit: 100 },
  );
  const deleteProduct = trpc.product.delete.useMutation({ onSuccess: () => refetch() });
  const duplicateProduct = trpc.product.duplicate.useMutation({ onSuccess: () => refetch() });
  const bulkDelete = trpc.product.bulkDelete.useMutation({
    onSuccess: () => { refetch(); setSelectedIds(new Set()); },
  });
  const bulkActivate = trpc.product.bulkActivate.useMutation({
    onSuccess: () => { refetch(); setSelectedIds(new Set()); },
  });
  const bulkSetBadge = trpc.product.bulkSetBadge.useMutation({
    onSuccess: () => { refetch(); setSelectedIds(new Set()); },
  });

  const products = data?.products ?? [];
  const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 5).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  const filteredProducts = products.filter((p) => {
    if (stockFilter === "low") return p.stockQuantity > 0 && p.stockQuantity < 5;
    if (stockFilter === "out") return p.stockQuantity === 0;
    if (stockFilter === "in") return p.stockQuantity >= 5;
    return true;
  }).filter((p) => {
    if (badgeFilter === "none") return !p.badge;
    if (badgeFilter !== "all") return p.badge === badgeFilter;
    return true;
  }).filter((p) => {
    if (featuredFilter === "yes") return p.featured;
    if (featuredFilter === "no") return !p.featured;
    return true;
  }).filter((p) => {
    if (activeFilter === "yes") return p.isActive;
    if (activeFilter === "no") return !p.isActive;
    return true;
  });

  const getStockBadge = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", class: "bg-[#E53935]/20 text-[#E53935]" };
    if (qty < 5) return { label: "Low Stock", class: "bg-orange-500/20 text-orange-400" };
    return { label: "In Stock", class: "bg-green-500/20 text-green-400" };
  };

  const getStockBar = (qty: number) => {
    if (qty === 0) return { width: "0%", color: "bg-[#E53935]" };
    if (qty < 5) return { width: `${Math.min(100, (qty / 20) * 100)}%`, color: "bg-orange-400" };
    return { width: `${Math.min(100, (qty / 50) * 100)}%`, color: "bg-green-400" };
  };

  const handleAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: (typeof products)[0]) => {
    setEditProduct(product as unknown as EditProductType);
    setShowModal(true);
  };

  const handleExportCSV = () => {
    const rows: ProductCSVRow[] = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      category: p.category,
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      images: Array.isArray(p.images) ? p.images.join(";") : "",
      sizes: Array.isArray(p.sizes) ? p.sizes.join(";") : "",
      colors: p.colors ? JSON.stringify(p.colors) : "",
      stockQuantity: String(p.stockQuantity),
      sku: p.sku ?? "",
      weightGrams: String(p.weightGrams ?? 500),
      featured: p.featured ? "true" : "false",
      isActive: p.isActive ? "true" : "false",
      badge: p.badge ?? "",
    }));
    const csv = productsToCSV(rows);
    downloadCSV(csv, `pacifika-products-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const [importPreview, setImportPreview] = useState<ProductCSVRow[] | null>(null);
  const [importResults, setImportResults] = useState<{ name: string; success: boolean; error?: string }[] | null>(null);
  const [importing, setImporting] = useState(false);
  const importCSV = trpc.product.importCSV.useMutation();

  const handleFileSelect = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      alert("No valid rows found in CSV.");
      return;
    }
    setImportPreview(rows);
    setImportResults(null);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setImporting(true);

    const rows = importPreview.map((row) => ({
      name: row.name,
      slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: row.description || undefined,
      category: (["dresses", "shirts", "puletasi", "kids"].includes(row.category) ? row.category : "dresses") as "dresses" | "shirts" | "puletasi" | "kids",
      price: parseFloat(row.price) || 0.01,
      salePrice: row.salePrice ? parseFloat(row.salePrice) : undefined,
      images: row.images || "",
      sizes: row.sizes || "",
      colors: row.colors || undefined,
      stockQuantity: parseInt(row.stockQuantity) || 0,
      sku: row.sku || undefined,
      weightGrams: parseInt(row.weightGrams) || 500,
      featured: row.featured === "true",
      isActive: row.isActive !== "false",
      badge: (["new", "bestseller", "limited"].includes(row.badge as string) ? row.badge as "new" | "bestseller" | "limited" : undefined),
    }));

    try {
      const result = await importCSV.mutateAsync({ rows });
      setImportResults(result.results);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      alert(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* Search + Add + CSV */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#243656] rounded-lg pl-9 pr-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
          />
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-[#243656] text-[#5BA4CF] px-3 rounded-lg flex items-center gap-1 text-xs flex-shrink-0"
          title="Export CSV"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-[#243656] text-[#D4A03C] px-3 rounded-lg flex items-center gap-1 text-xs flex-shrink-0"
          title="Import CSV"
        >
          <Upload size={14} />
        </button>
        <button
          onClick={handleAdd}
          className="bg-[#D4A03C] text-[#1B2A4A] px-4 rounded-lg flex items-center gap-1.5 font-medium text-sm flex-shrink-0"
        >
          <Plus size={16} />
          Add
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
            if (e.target) e.target.value = "";
          }}
        />
      </div>

      {/* Inventory Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-[#E53935]/10 border border-[#E53935]/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-[#E53935] flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-[#E53935]">Inventory Alert</p>
            <p className="text-[#8A94A6]">
              {lowStockCount > 0 && <span>{lowStockCount} low stock</span>}
              {lowStockCount > 0 && outOfStockCount > 0 && <span> / </span>}
              {outOfStockCount > 0 && <span>{outOfStockCount} out of stock</span>}
            </p>
          </div>
        </div>
      )}

      {/* Stock Filter */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
        {([
          { key: "all" as const, label: "All", count: products.length },
          { key: "low" as const, label: "Low Stock", count: lowStockCount },
          { key: "out" as const, label: "Out of Stock", count: outOfStockCount },
          { key: "in" as const, label: "In Stock", count: products.length - lowStockCount - outOfStockCount },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setStockFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1.5 ${
              stockFilter === f.key ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stockFilter === f.key ? "bg-[#1B2A4A]/20" : "bg-[#1B2A4A]/50"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Badge Filter */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
        {([
          { key: "all" as const, label: "All Badges" },
          { key: "new" as const, label: "New", color: "bg-[#5BA4CF]/20 text-[#5BA4CF]" },
          { key: "bestseller" as const, label: "Bestseller", color: "bg-[#D4A03C]/20 text-[#D4A03C]" },
          { key: "limited" as const, label: "Limited", color: "bg-[#E53935]/20 text-[#E53935]" },
          { key: "none" as const, label: "No Badge" },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setBadgeFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              badgeFilter === f.key
                ? f.color ?? "bg-[#D4A03C] text-[#1B2A4A]"
                : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Featured + Active Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {[
          { label: "All", state: featuredFilter, set: setFeaturedFilter, val: "all" as const },
          { label: "Featured", state: featuredFilter, set: setFeaturedFilter, val: "yes" as const },
          { label: "Not Featured", state: featuredFilter, set: setFeaturedFilter, val: "no" as const },
        ].map((f) => (
          <button
            key={`f-${f.val}`}
            onClick={() => f.set(f.val)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              f.state === f.val ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-[#8A94A6]/20 mx-1" />
        {[
          { label: "Active", state: activeFilter, set: setActiveFilter, val: "yes" as const },
          { label: "Inactive", state: activeFilter, set: setActiveFilter, val: "no" as const },
        ].map((f) => (
          <button
            key={`a-${f.val}`}
            onClick={() => f.set(f.val)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              f.state === f.val ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Select All + Bulk Actions */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
            }
          }}
          className="flex items-center gap-1.5 text-xs text-[#8A94A6]"
        >
          {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
            <CheckSquare size={16} className="text-[#D4A03C]" />
          ) : (
            <Square size={16} />
          )}
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select All"}
        </button>
        <p className="text-xs text-[#8A94A6]">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#243656] rounded-xl p-2.5 mb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => { if (confirm(`Delete ${selectedIds.size} products?`)) bulkDelete.mutate({ ids: Array.from(selectedIds) }); }}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/20 flex items-center gap-1 flex-shrink-0"
          >
            <Trash2 size={12} /> Delete
          </button>
          <button
            onClick={() => bulkActivate.mutate({ ids: Array.from(selectedIds), isActive: true })}
            className="px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 flex-shrink-0"
          >
            Activate
          </button>
          <button
            onClick={() => bulkActivate.mutate({ ids: Array.from(selectedIds), isActive: false })}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#8A94A6]/10 text-[#8A94A6] border border-[#8A94A6]/20 flex items-center gap-1 flex-shrink-0"
          >
            Deactivate
          </button>
          {[
            { label: "New", val: "new" as const },
            { label: "Bestseller", val: "bestseller" as const },
            { label: "Limited", val: "limited" as const },
          ].map((b) => (
            <button
              key={b.val}
              onClick={() => bulkSetBadge.mutate({ ids: Array.from(selectedIds), badge: b.val })}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#D4A03C]/10 text-[#D4A03C] border border-[#D4A03C]/20 flex items-center gap-1 flex-shrink-0"
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={() => bulkSetBadge.mutate({ ids: Array.from(selectedIds), badge: null })}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#8A94A6]/10 text-[#8A94A6] border border-[#8A94A6]/20 flex items-center gap-1 flex-shrink-0"
          >
            Remove Badge
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((product) => {
          const stockBadge = getStockBadge(product.stockQuantity);
          const stockBar = getStockBar(product.stockQuantity);
          return (
            <div key={product.id} className="bg-[#243656] rounded-xl p-3 flex gap-3 items-start">
              {/* Checkbox */}
              <button
                onClick={() => {
                  const next = new Set(selectedIds);
                  if (next.has(product.id)) next.delete(product.id);
                  else next.add(product.id);
                  setSelectedIds(next);
                }}
                className="mt-1 flex-shrink-0"
              >
                {selectedIds.has(product.id) ? (
                  <CheckSquare size={18} className="text-[#D4A03C]" />
                ) : (
                  <Square size={18} className="text-[#8A94A6]" />
                )}
              </button>
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                <LazyImage
                  src={Array.isArray(product.images) ? product.images[0] : ""}
                  alt={product.name}
                  className="w-14 h-14"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-[#D4A03C] font-bold mt-0.5">
                      ${Number(product.price).toFixed(2)}
                      {product.salePrice && (
                        <span className="text-[#8A94A6] line-through ml-1.5 font-normal">
                          ${Number(product.salePrice).toFixed(2)}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] bg-[#1B2A4A] text-[#8A94A6] px-1.5 py-0.5 rounded">{product.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stockBadge.class}`}>
                        {stockBadge.label}
                      </span>
                      {product.featured && (
                        <span className="text-[10px] bg-[#D4A03C]/20 text-[#D4A03C] px-1.5 py-0.5 rounded-full">Featured</span>
                      )}
                    </div>
                    {/* Stock Level Bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-[#1B2A4A] rounded-full overflow-hidden">
                        <div className={`h-full ${stockBar.color} rounded-full transition-all`} style={{ width: stockBar.width }} />
                      </div>
                      <span className={`text-[10px] font-medium ${product.stockQuantity === 0 ? "text-[#E53935]" : product.stockQuantity < 5 ? "text-orange-400" : "text-green-400"}`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-[#8A94A6] hover:text-[#D4A03C]"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Duplicate "${product.name}"?`)) duplicateProduct.mutate({ id: product.id }); }}
                      className="p-2 text-[#8A94A6] hover:text-[#5BA4CF]"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${product.name}"?`)) deleteProduct.mutate({ id: product.id }); }}
                      className="p-2 text-[#8A94A6] hover:text-[#E53935]"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditProduct(null); }}
        onSuccess={() => refetch()}
        editProduct={editProduct}
      />

      {/* CSV Import Preview */}
      {importPreview && !importResults && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setImportPreview(null)} />
          <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0F1923] px-4 pt-4 pb-3 border-b border-[#243656] z-10">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Import Preview</h3>
                <button onClick={() => setImportPreview(null)} className="p-2"><X size={18} /></button>
              </div>
              <p className="text-xs text-[#8A94A6]">{importPreview.length} product{importPreview.length !== 1 ? "s" : ""} ready to import</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {importPreview.slice(0, 20).map((row, i) => (
                <div key={i} className="bg-[#243656] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B2A4A] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-[#8A94A6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{row.name}</p>
                    <p className="text-[10px] text-[#8A94A6]">{row.category} · ${row.price} · Stock: {row.stockQuantity}</p>
                  </div>
                </div>
              ))}
              {importPreview.length > 20 && (
                <p className="text-xs text-[#8A94A6] text-center">...and {importPreview.length - 20} more</p>
              )}
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 sticky bottom-0"
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={16} />}
                {importing ? "Importing..." : `Import ${importPreview.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Results */}
      {importResults && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setImportResults(null); setImportPreview(null); }} />
          <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0F1923] px-4 pt-4 pb-3 border-b border-[#243656] z-10">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Import Complete</h3>
              <p className="text-xs text-green-400">{importResults.filter((r) => r.success).length} imported · {importResults.filter((r) => !r.success).length} failed</p>
            </div>
            <div className="px-4 py-3 space-y-1 max-h-60 overflow-y-auto">
              {importResults.filter((r) => !r.success).map((r, i) => (
                <div key={i} className="text-xs text-[#E53935] bg-[#E53935]/10 rounded-lg p-2">
                  <span className="font-medium">{r.name}</span>: {r.error}
                </div>
              ))}
              {importResults.filter((r) => !r.success).length === 0 && (
                <p className="text-xs text-green-400 text-center py-4">All products imported successfully!</p>
              )}
            </div>
            <div className="px-4 py-3">
              <button
                onClick={() => { setImportResults(null); setImportPreview(null); }}
                className="w-full bg-[#243656] py-3 rounded-lg font-medium text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Orders ─── */
function OrdersTab() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "name_asc">("date_desc");
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<number, string>>({});
  const { data, refetch } = trpc.order.getAdminList.useQuery({
    status: status || undefined,
    search: search || undefined,
    sort,
  });
  const { data: detailData } = trpc.order.getAdminDetail.useQuery(
    { id: detailOrderId! },
    { enabled: detailOrderId !== null }
  );
  const updateStatus = trpc.order.updateStatus.useMutation({ onSuccess: () => refetch() });
  const setTracking = trpc.order.setTracking.useMutation({ onSuccess: () => refetch() });

  const handleExportOrders = () => {
    const orders = data?.orders ?? [];
    const rows: OrderCSVRow[] = orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-AU") : "",
      status: o.status ?? "",
      customerName: o.shippingName ?? "",
      customerEmail: o.shippingEmail ?? "",
      shippingAddress: `${o.shippingAddress1 ?? ""} ${o.shippingAddress2 ?? ""}, ${o.shippingCity ?? ""} ${o.shippingState ?? ""} ${o.shippingPostcode ?? ""}`.trim(),
      items: "",
      subtotal: Number(o.subtotal).toFixed(2),
      shipping: Number(o.shippingCost).toFixed(2),
      discount: Number(o.discountAmount ?? 0).toFixed(2),
      total: Number(o.total).toFixed(2),
      paymentReference: o.paymentReference ?? "",
      trackingNumber: o.trackingNumber ?? "",
      customerNotes: (o as Record<string, unknown>).customerNotes as string ?? "",
    }));
    const csv = ordersToCSV(rows);
    downloadCSV(csv, `pacifika-orders-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const statusSteps = [
    { key: "pending_payment", label: "Pending Payment" },
    { key: "received", label: "Received" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
        <input
          type="text"
          placeholder="Search orders by number, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#243656] rounded-lg pl-9 pr-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
        />
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide items-center">
        {["All", "Received", "Processing", "Shipped", "Delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s === "All" ? "" : s.toLowerCase())}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              (s === "All" && !status) || status === s.toLowerCase()
                ? "bg-[#D4A03C] text-[#1B2A4A]"
                : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {s}
          </button>
        ))}
        {/* Sort Dropdown */}
        <div className="relative ml-auto flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="appearance-none bg-[#243656] text-[#8A94A6] pl-3 pr-7 py-1.5 rounded-full text-xs border border-transparent focus:border-[#D4A03C] outline-none cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Total</option>
            <option value="amount_asc">Lowest Total</option>
            <option value="name_asc">Customer A-Z</option>
          </select>
          <ArrowUpDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
        </div>
        <button
          onClick={handleExportOrders}
          className="bg-[#243656] text-[#5BA4CF] px-3 py-1.5 rounded-full text-xs flex items-center gap-1 flex-shrink-0"
          title="Export orders to CSV"
        >
          <Download size={12} /> Export
        </button>
      </div>

      <div className="space-y-2">
        {(data?.orders ?? []).map((order) => (
          <div
            key={order.id}
            className="bg-[#243656] rounded-xl p-4 cursor-pointer"
            onClick={() => setDetailOrderId(order.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-mono text-[#D4A03C]">{order.orderNumber}</p>
                <p className="text-xs text-[#8A94A6]">{order.shippingName}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[order.status ?? "received"]}`}>
                {order.status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm font-bold mt-2">${Number(order.total).toFixed(2)}</p>
            <div className="flex gap-2 mt-2">
              {order.status === "pending_payment" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "received" })}
                  className="text-xs bg-[#5BA4CF] text-white px-3 py-1.5 rounded-lg"
                >
                  Mark Received
                </button>
              )}
              {order.status === "received" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "processing" })}
                  className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg"
                >
                  Mark Processing
                </button>
              )}
              {order.status === "processing" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "shipped" })}
                  className="text-xs bg-[#D4A03C] text-[#1B2A4A] px-3 py-1.5 rounded-lg"
                >
                  Mark Shipped
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: "delivered" })}
                  className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg"
                >
                  Mark Delivered
                </button>
              )}
            </div>
            {/* Customer Notes */}
            {(() => {
              const notes = (order as Record<string, unknown>).customerNotes as string | undefined;
              return notes ? (
                <div className="mt-2 pt-2 border-t border-[#8A94A6]/10">
                  <p className="text-[10px] text-[#8A94A6] uppercase">Customer Notes</p>
                  <p className="text-xs text-[#F0EDE6]/80 mt-0.5">{notes}</p>
                </div>
              ) : null;
            })()}

            {/* Admin Notes */}
            <AdminNotesEditor orderId={order.id} initialNotes={(order as Record<string, unknown>).adminNotes as string | undefined} />

            {/* Tracking Number Input */}
            {(order.status === "processing" || order.status === "shipped" || order.status === "delivered") && (
              <div className="mt-2 pt-2 border-t border-[#8A94A6]/10">
                {order.trackingNumber ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#8A94A6] uppercase">Tracking</p>
                      <p className="text-xs font-mono text-[#5BA4CF]">{order.trackingNumber}</p>
                    </div>
                    <a
                      href={`https://auspost.com.au/mypost/track/#/details/${order.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#5BA4CF] underline"
                    >
                      Track
                    </a>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      value={trackingInput[order.id] ?? ""}
                      onChange={(e) => setTrackingInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                      className="flex-1 bg-[#1B2A4A] rounded-lg px-3 py-1.5 text-xs border border-transparent focus:border-[#D4A03C] outline-none"
                    />
                    <button
                      onClick={() => {
                        const num = trackingInput[order.id]?.trim();
                        if (num) setTracking.mutate({ id: order.id, trackingNumber: num });
                      }}
                      disabled={setTracking.isPending || !trackingInput[order.id]?.trim()}
                      className="bg-[#5BA4CF] text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {setTracking.isPending ? "..." : "Add"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {detailOrderId !== null && detailData && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setDetailOrderId(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#1B2A4A] rounded-t-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Order Details</h2>
              <button onClick={() => setDetailOrderId(null)} className="p-2 -mr-2">
                <X size={20} className="text-[#8A94A6]" />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-4">
              {/* Order Number & Status */}
              <div className="bg-[#243656] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-mono text-[#D4A03C]">{detailData.orderNumber}</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[detailData.status ?? "received"]}`}>
                    {detailData.status?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-[#8A94A6]">
                  {detailData.createdAt ? new Date(detailData.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>

              {/* Customer Info */}
              <div className="bg-[#243656] rounded-xl p-4">
                <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Customer</h3>
                <p className="text-sm font-medium">{detailData.shippingName}</p>
                <p className="text-xs text-[#8A94A6]">{detailData.shippingEmail}</p>
                {detailData.shippingPhone && <p className="text-xs text-[#8A94A6]">{detailData.shippingPhone}</p>}
              </div>

              {/* Shipping Address */}
              <div className="bg-[#243656] rounded-xl p-4">
                <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Shipping Address</h3>
                <p className="text-sm">{detailData.shippingAddress1}</p>
                {detailData.shippingAddress2 && <p className="text-sm">{detailData.shippingAddress2}</p>}
                <p className="text-sm">{detailData.shippingCity}, {detailData.shippingState} {detailData.shippingPostcode}</p>
                <p className="text-sm">{detailData.shippingCountry}</p>
              </div>

              {/* Customer Notes */}
              {(() => {
                const notes = (detailData as Record<string, unknown>).customerNotes as string | undefined;
                return notes ? (
                  <div className="bg-[#D4A03C]/10 border border-[#D4A03C]/20 rounded-xl p-4">
                    <h3 className="text-xs text-[#D4A03C] uppercase tracking-wider mb-1">Customer Notes</h3>
                    <p className="text-sm text-[#F0EDE6]/80">{notes}</p>
                  </div>
                ) : null;
              })()}

              {/* Items */}
              <div>
                <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Items</h3>
                <div className="space-y-2">
                  {detailData.items?.map((item) => (
                    <div key={item.id} className="bg-[#243656] rounded-xl p-3 flex gap-3">
                      {item.productImage && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-[#8A94A6]">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && " / "}
                          {item.color && `Color: ${item.color}`}
                          {" x"}{item.quantity}
                        </p>
                        <p className="text-[#D4A03C] font-bold text-sm">${Number(item.totalPrice).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-[#243656] rounded-xl p-4 space-y-1.5">
                <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Payment</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8A94A6]">Subtotal (incl. GST)</span>
                  <span>${Number(detailData.subtotal).toFixed(2)}</span>
                </div>
                {Number(detailData.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A94A6]">Discount</span>
                    <span className="text-green-400">-${Number(detailData.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#8A94A6]">Shipping</span>
                  <span className={Number(detailData.shippingCost) === 0 ? "text-green-400" : ""}>
                    {Number(detailData.shippingCost) === 0 ? "FREE" : `$${Number(detailData.shippingCost).toFixed(2)}`}
                  </span>
                </div>
                {(detailData as Record<string, unknown>).gstAmount ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A94A6]">GST (10%)</span>
                    <span className="text-[#D4A03C]/80">${Number((detailData as Record<string, unknown>).gstAmount as number).toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="border-t border-[#8A94A6]/20 pt-1.5 flex justify-between">
                  <span className="font-semibold">Total (AUD)</span>
                  <span className="text-[#D4A03C] font-bold">${Number(detailData.total).toFixed(2)}</span>
                </div>
                {detailData.paymentReference && (
                  <p className="text-xs text-[#8A94A6] mt-1">Ref: {detailData.paymentReference}</p>
                )}
              </div>

              {/* Tracking */}
              {detailData.trackingNumber && (
                <div className="bg-[#5BA4CF]/10 border border-[#5BA4CF]/20 rounded-xl p-4">
                  <p className="text-[10px] text-[#8A94A6] uppercase">Tracking Number</p>
                  <p className="text-sm font-mono font-bold text-[#5BA4CF]">{detailData.trackingNumber}</p>
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Status History</h3>
                <div className="space-y-0">
                  {detailData.statusHistory?.map((h, i) => {
                    const stepInfo = statusSteps.find((s) => s.key === h.status);
                    return (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D4A03C]" />
                          {i < (detailData.statusHistory?.length ?? 0) - 1 && <div className="w-px h-6 bg-[#8A94A6]/20" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-medium">{stepInfo?.label ?? h.status}</p>
                          <p className="text-[10px] text-[#8A94A6]">{h.note}</p>
                          <p className="text-[10px] text-[#8A94A6]">
                            {h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Promos ─── */
function PromosTab() {
  const { data, refetch } = trpc.promo.list.useQuery();
  const deletePromo = trpc.promo.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-2">
      {(data ?? []).map((promo) => (
        <div key={promo.id} className="bg-[#243656] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-mono font-bold text-[#D4A03C]">{promo.code}</p>
            <p className="text-xs text-[#8A94A6]">
              {promo.type === "percentage" ? `${promo.value}% off` : `$${promo.value} off`}
              {promo.usageLimit ? ` (limit: ${promo.usageLimit})` : ""}
            </p>
            <p className="text-xs text-[#8A94A6]">Used: {promo.usageCount ?? 0} times</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${promo.isActive ? "bg-green-500/20 text-green-400" : "bg-[#8A94A6]/20 text-[#8A94A6]"}`}>
              {promo.isActive ? "Active" : "Inactive"}
            </span>
            <button
              onClick={() => { if (confirm("Delete?")) deletePromo.mutate({ id: promo.id }); }}
              className="p-2 text-[#8A94A6] hover:text-[#E53935]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Analytics Settings ─── */
function AnalyticsSettingsTab() {
  const [gaId, setGaId] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [savedGA, setSavedGA] = useState(false);
  const [savedPixel, setSavedPixel] = useState(false);

  const { data: gaSetting } = trpc.settings.get.useQuery({ key: "ga_measurement_id" });
  const { data: pixelSetting } = trpc.settings.get.useQuery({ key: "fb_pixel_id" });
  const setSetting = trpc.settings.set.useMutation();

  useEffect(() => {
    if (gaSetting?.value && gaSetting.value !== "G-XXXXXXXXXX") setGaId(gaSetting.value);
  }, [gaSetting]);

  useEffect(() => {
    if (pixelSetting?.value) setPixelId(pixelSetting.value);
  }, [pixelSetting]);

  const handleSaveGA = async () => {
    const id = gaId.trim();
    if (!id || !id.startsWith("G-")) return;
    await setSetting.mutateAsync({ key: "ga_measurement_id", value: id, group: "analytics" });
    setSavedGA(true);
    setTimeout(() => setSavedGA(false), 3000);
  };

  const handleSavePixel = async () => {
    const id = pixelId.trim();
    if (!id) return;
    await setSetting.mutateAsync({ key: "fb_pixel_id", value: id, group: "analytics" });
    setSavedPixel(true);
    setTimeout(() => setSavedPixel(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Google Analytics */}
      <div className="bg-[#243656] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-1">Google Analytics 4</h3>
        <p className="text-xs text-[#8A94A6] mb-4">Track sales, user behaviour, and advertising performance.</p>
        <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Measurement ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="flex-1 bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
          />
          <button
            onClick={handleSaveGA}
            disabled={setSetting.isPending}
            className="bg-[#D4A03C] text-[#1B2A4A] px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {savedGA && <p className="text-green-400 text-xs mt-2">Saved! Refresh to activate.</p>}
      </div>

      {/* Facebook Pixel */}
      <div className="bg-[#243656] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-1">Facebook Pixel</h3>
        <p className="text-xs text-[#8A94A6] mb-4">Track conversions from Facebook ads and social shares.</p>
        <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Pixel ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="123456789012345"
            className="flex-1 bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
          />
          <button
            onClick={handleSavePixel}
            disabled={setSetting.isPending}
            className="bg-[#5BA4CF] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {savedPixel && <p className="text-green-400 text-xs mt-2">Saved! Refresh to activate.</p>}
        <div className="mt-4 pt-4 border-t border-[#8A94A6]/10">
          <p className="text-xs text-[#8A94A6] mb-2">Where to find your Pixel ID:</p>
          <ol className="text-xs text-[#8A94A6] space-y-1 list-decimal pl-4">
            <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#5BA4CF]">Facebook Events Manager</a></li>
            <li>Select your data source</li>
            <li>Copy the Pixel ID (numeric string)</li>
          </ol>
        </div>
      </div>
      <div className="bg-[#243656] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Automatically Tracked Events</h3>
        <div className="space-y-2">
          {[
            { event: "page_view", desc: "Every page navigation" },
            { event: "view_item", desc: "Product detail page viewed" },
            { event: "add_to_cart", desc: "Item added to shopping bag" },
            { event: "view_cart", desc: "Shopping bag viewed" },
            { event: "begin_checkout", desc: "Checkout initiated" },
            { event: "purchase", desc: "Order completed with value & items" },
            { event: "search", desc: "Product search queries" },
            { event: "share", desc: "Product shared on Facebook" },
            { event: "apply_promo", desc: "Promo code used" },
          ].map((e) => (
            <div key={e.event} className="flex items-center justify-between py-1.5 border-b border-[#8A94A6]/5 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D4A03C]" />
                <span className="text-xs font-mono text-[#D4A03C]">{e.event}</span>
              </div>
              <span className="text-xs text-[#8A94A6]">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Store Settings ─── */
function StoreSettingsTab() {
  const { data: settingsData } = trpc.settings.getGroup.useQuery({ group: "store" });
  const setSetting = trpc.settings.set.useMutation();
  const utils = trpc.useUtils();

  const getValue = (key: string, fallback = "") => {
    return settingsData?.find((s) => s.key === key)?.value ?? fallback;
  };

  const [storeName, setStoreName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBsb, setBankBsb] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setStoreName(getValue("store_name", "Pacifika Wear"));
      setContactEmail(getValue("contact_email", "joelandamale@gmail.com"));
      setContactPhone(getValue("contact_phone", "0460786986"));
      setFacebookUrl(getValue("facebook_url", "https://facebook.com"));
      setInstagramUrl(getValue("instagram_url", "https://instagram.com"));
      setBankName(getValue("bank_name", "Commonwealth Bank"));
      setBankBsb(getValue("bank_bsb", "064836"));
      setBankAccount(getValue("bank_account_number", "10465795"));
      setBankAccountName(getValue("bank_account_name", "Joel Andamale T/A Pacifika Wear"));
    }
  }, [settingsData]);

  const handleSave = async () => {
    // Store info
    const storeUpdates = [
      { key: "store_name", value: storeName, group: "store" },
      { key: "contact_email", value: contactEmail, group: "store" },
      { key: "contact_phone", value: contactPhone, group: "store" },
      { key: "facebook_url", value: facebookUrl, group: "store" },
      { key: "instagram_url", value: instagramUrl, group: "store" },
    ];

    // Bank details — save to "payment" group so checkout reads them
    const bankUpdates = [
      { key: "bank_name", value: bankName, group: "payment" },
      { key: "bank_bsb", value: bankBsb, group: "payment" },
      { key: "bank_account_number", value: bankAccount, group: "payment" },
      { key: "bank_account_name", value: bankAccountName, group: "payment" },
    ];

    for (const u of [...storeUpdates, ...bankUpdates]) {
      await setSetting.mutateAsync(u);
    }

    utils.settings.getGroup.invalidate({ group: "store" });
    utils.settings.getGroup.invalidate({ group: "payment" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields = [
    { label: "Store Name", value: storeName, set: setStoreName, placeholder: "Pacifika Wear" },
    { label: "Contact Email", value: contactEmail, set: setContactEmail, placeholder: "joelandamale@gmail.com", type: "email" },
    { label: "Contact Phone", value: contactPhone, set: setContactPhone, placeholder: "0460786986", type: "tel" },
    { label: "Facebook URL", value: facebookUrl, set: setFacebookUrl, placeholder: "https://facebook.com/..." },
    { label: "Instagram URL", value: instagramUrl, set: setInstagramUrl, placeholder: "https://instagram.com/..." },
  ];

  const bankFields = [
    { label: "Bank Name", value: bankName, set: setBankName, placeholder: "Commonwealth Bank" },
    { label: "BSB", value: bankBsb, set: setBankBsb, placeholder: "064836" },
    { label: "Account Number", value: bankAccount, set: setBankAccount, placeholder: "10465795" },
    { label: "Account Name", value: bankAccountName, set: setBankAccountName, placeholder: "Joel Andamale T/A Pacifika Wear" },
  ];

  return (
    <div className="space-y-5 pb-8">
      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle size={16} /> Store settings saved successfully!
        </div>
      )}

      {/* Store Info */}
      <div className="bg-[#243656] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Store size={16} className="text-[#D4A03C]" />
          <h3 className="text-sm font-semibold">Store Information</h3>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-[#243656] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-[#5BA4CF]" />
          <h3 className="text-sm font-semibold">Bank Account Details</h3>
        </div>
        <p className="text-xs text-[#8A94A6] mb-3">
          These details appear on the checkout page for bank transfer payments.
        </p>
        <div className="space-y-3">
          {bankFields.map((f) => (
            <div key={f.label}>
              <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={setSetting.isPending}
        className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm disabled:opacity-50"
      >
        {setSetting.isPending ? "Saving..." : "Save Store Settings"}
      </button>
    </div>
  );
}

/* ─── Reviews (Moderation) ─── */
function ReviewsTab() {
  const { data, refetch } = trpc.review.adminList.useQuery();
  const moderate = trpc.review.moderate.useMutation({ onSuccess: () => refetch() });
  const deleteReview = trpc.review.delete.useMutation({ onSuccess: () => refetch() });
  const replyMutation = trpc.review.reply.useMutation({ onSuccess: () => refetch() });
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const reviews = (data ?? []).filter((r) => {
    if (filter === "approved") return r.isApproved;
    if (filter === "pending") return !r.isApproved;
    return true;
  });

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {[
          { key: "all" as const, label: "All", count: (data ?? []).length },
          { key: "pending" as const, label: "Pending", count: (data ?? []).filter((r) => !r.isApproved).length },
          { key: "approved" as const, label: "Approved", count: (data ?? []).filter((r) => r.isApproved).length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1.5 ${
              filter === f.key ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-[#1B2A4A]/20" : "bg-[#1B2A4A]/50"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {reviews.length === 0 ? (
          <div className="bg-[#243656] rounded-xl p-8 text-center">
            <p className="text-[#8A94A6] text-sm">No reviews found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{review.userName}</p>
                    {!review.isApproved && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                    {review.isApproved && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8A94A6] mb-1">{review.productName}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= review.rating ? "text-[#D4A03C] fill-[#D4A03C]" : "text-[#8A94A6]"}
                      />
                    ))}
                    <span className="text-[10px] text-[#8A94A6] ml-1">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="text-sm text-[#F0EDE6]/80">{review.comment?.replace(" [Verified Purchase]", "")}</p>
                  {review.comment?.includes("[Verified Purchase]") && (
                    <span className="text-[10px] text-green-400 mt-1 inline-block">Verified Purchase</span>
                  )}
                  {/* Owner Reply */}
                  {(review as Record<string, unknown>).ownerReply ? (
                    <div className="mt-3 bg-[#D4A03C]/10 border border-[#D4A03C]/20 rounded-lg p-3">
                      <p className="text-[10px] text-[#D4A03C] font-semibold uppercase tracking-wider mb-1">Owner Response</p>
                      <p className="text-xs text-[#F0EDE6]/80">{((review as Record<string, unknown>).ownerReply as { reply: string }).reply}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === review.id && (
                <div className="mt-3 bg-[#1B2A4A] rounded-lg p-3 space-y-2">
                  <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider">Reply as Owner</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a response..."
                    rows={2}
                    className="w-full bg-[#243656] rounded-lg px-3 py-2 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!replyText.trim()) return;
                        replyMutation.mutate({ reviewId: review.id, reply: replyText.trim() });
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      disabled={!replyText.trim()}
                      className="bg-[#D4A03C] text-[#1B2A4A] px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      Post Reply
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(""); }}
                      className="bg-[#243656] px-4 py-1.5 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#8A94A6]/10">
                <button
                  onClick={() => moderate.mutate({ id: review.id, isApproved: !review.isApproved })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
                    review.isApproved
                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}
                >
                  {review.isApproved ? <EyeOff size={12} /> : <Eye size={12} />}
                  {review.isApproved ? "Unapprove" : "Approve"}
                </button>
                <button
                  onClick={() => { setReplyingTo(review.id); setReplyText(((review as Record<string, unknown>).ownerReply as { reply: string } | undefined)?.reply ?? ""); }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-[#5BA4CF]/10 text-[#5BA4CF] border border-[#5BA4CF]/20"
                >
                  <MessageSquare size={12} />
                  {(review as Record<string, unknown>).ownerReply ? "Edit Reply" : "Reply"}
                </button>
                <button
                  onClick={() => { if (confirm("Delete this review?")) deleteReview.mutate({ id: review.id }); }}
                  className="px-3 py-2 rounded-lg text-xs text-[#E53935] border border-[#E53935]/20 hover:bg-[#E53935]/10"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Waitlist ─── */
function WaitlistTab() {
  const { data, refetch } = trpc.waitlist.adminList.useQuery();
  const markNotified = trpc.waitlist.markNotified.useMutation({ onSuccess: () => refetch() });
  const deleteEntry = trpc.waitlist.delete.useMutation({ onSuccess: () => refetch() });

  const pending = (data ?? []).filter((w) => !w.notified);
  const notified = (data ?? []).filter((w) => w.notified);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Waiting</p>
          <p className="text-2xl font-bold text-[#D4A03C]">{pending.length}</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Notified</p>
          <p className="text-2xl font-bold text-green-400">{notified.length}</p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Waiting for Stock</h3>
          <div className="space-y-2">
            {pending.map((entry) => (
              <div key={entry.id} className="bg-[#243656] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.productName}</p>
                    <p className="text-xs text-[#8A94A6]">{entry.email}</p>
                    <p className="text-[10px] text-[#8A94A6] mt-0.5">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ""}
                      {entry.productStock !== undefined && (
                        <span className={entry.productStock > 0 ? " text-green-400 ml-1" : ""}>
                          Stock: {entry.productStock}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => markNotified.mutate({ id: entry.id })}
                      className="px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20"
                    >
                      Mark Notified
                    </button>
                    <button
                      onClick={() => { if (confirm("Remove this entry?")) deleteEntry.mutate({ id: entry.id }); }}
                      className="p-1.5 text-[#8A94A6] hover:text-[#E53935]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notified */}
      {notified.length > 0 && (
        <div>
          <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2">Already Notified</h3>
          <div className="space-y-2">
            {notified.map((entry) => (
              <div key={entry.id} className="bg-[#243656] rounded-xl p-4 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.productName}</p>
                    <p className="text-xs text-[#8A94A6]">{entry.email}</p>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full mt-1 inline-block">Notified</span>
                  </div>
                  <button
                    onClick={() => { if (confirm("Remove this entry?")) deleteEntry.mutate({ id: entry.id }); }}
                    className="p-1.5 text-[#8A94A6] hover:text-[#E53935]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && notified.length === 0 && (
        <div className="bg-[#243656] rounded-xl p-8 text-center">
          <Bell size={32} className="text-[#8A94A6] mx-auto mb-3" />
          <p className="text-[#8A94A6] text-sm">No waitlist entries yet</p>
          <p className="text-[#8A94A6] text-xs mt-1">Customers will appear here when they request stock notifications</p>
        </div>
      )}
    </div>
  );
}

/* ─── Admin Notes Editor ─── */
function AdminNotesEditor({ orderId, initialNotes }: { orderId: number; initialNotes?: string }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const utils = trpc.useUtils();
  const saveNotes = trpc.order.setAdminNotes.useMutation({
    onSuccess: () => {
      setEditing(false);
      utils.order.getAdminList.invalidate();
      utils.order.getAdminDetail.invalidate();
    },
  });

  return (
    <div className="mt-2 pt-2 border-t border-[#8A94A6]/10">
      {!editing ? (
        <button onClick={() => setEditing(true)} className="text-left w-full">
          {notes ? (
            <>
              <p className="text-[10px] text-[#5BA4CF] uppercase">Admin Notes</p>
              <p className="text-xs text-[#F0EDE6]/80 mt-0.5">{notes}</p>
            </>
          ) : (
            <p className="text-[10px] text-[#8A94A6] uppercase flex items-center gap-1">
              <Edit2 size={10} /> Add Admin Note
            </p>
          )}
        </button>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-[#5BA4CF] uppercase">Admin Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes about this order..."
            rows={2}
            className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2 text-xs border border-transparent focus:border-[#D4A03C] outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => saveNotes.mutate({ id: orderId, adminNotes: notes })}
              disabled={saveNotes.isPending}
              className="bg-[#5BA4CF] text-white px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {saveNotes.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setNotes(initialNotes ?? ""); }} className="text-[#8A94A6] px-2 py-1 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Customers Directory ─── */
function CustomersTab() {
  const { data, isLoading } = trpc.customer.list.useQuery();
  const [detailEmail, setDetailEmail] = useState<string | null>(null);
  const { data: detailData } = trpc.customer.getDetail.useQuery(
    { email: detailEmail! },
    { enabled: !!detailEmail }
  );
  const [search, setSearch] = useState("");

  const customers = (data?.customers ?? []).filter((c) => {
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
  });

  if (detailEmail && detailData) {
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetailEmail(null)} className="p-2 bg-[#243656] rounded-lg">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-sm font-semibold">Customer Detail</h2>
        </div>

        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-lg font-bold">{detailData.name}</p>
          <p className="text-xs text-[#8A94A6]">{detailData.email}</p>
          {detailData.phone && <p className="text-xs text-[#8A94A6]">{detailData.phone}</p>}
          <p className="text-xs text-[#8A94A6] mt-1">{detailData.address}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#243656] rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[#D4A03C]">{detailData.totalOrders}</p>
            <p className="text-[10px] text-[#8A94A6]">Orders</p>
          </div>
          <div className="bg-[#243656] rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[#D4A03C]">${detailData.totalSpent.toFixed(2)}</p>
            <p className="text-[10px] text-[#8A94A6]">Spent</p>
          </div>
          <div className="bg-[#243656] rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{detailData.lastOrder ? new Date(detailData.lastOrder).toLocaleDateString("en-AU", { month: "short", day: "numeric" }) : "-"}</p>
            <p className="text-[10px] text-[#8A94A6]">Last Order</p>
          </div>
        </div>

        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Order History</h3>
          <div className="space-y-2">
            {detailData.orders.map((o) => (
              <div key={o.id} className="bg-[#1B2A4A] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono text-[#D4A03C]">{o.orderNumber}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColors[o.status ?? "received"]}`}>
                    {o.status?.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-[#8A94A6]">
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-AU") : ""} | ${Number(o.total).toFixed(2)}
                </p>
                {o.items && o.items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {o.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.productImage && (
                          <img src={item.productImage} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <p className="text-[10px] text-[#F0EDE6]/70 line-clamp-1">{item.productName} x{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#243656] rounded-lg pl-9 pr-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Total Customers</p>
          <p className="text-2xl font-bold">{data?.totalCustomers ?? 0}</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Lifetime Value</p>
          <p className="text-2xl font-bold text-[#D4A03C]">${(data?.totalLifetimeValue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="bg-[#243656] rounded-xl p-4 h-16 animate-pulse" />)
        ) : customers.length === 0 ? (
          <div className="bg-[#243656] rounded-xl p-8 text-center">
            <Users size={32} className="text-[#8A94A6] mx-auto mb-3" />
            <p className="text-[#8A94A6] text-sm">No customers yet</p>
          </div>
        ) : (
          customers.map((c) => (
            <button key={c.email} onClick={() => setDetailEmail(c.email)} className="w-full text-left bg-[#243656] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#D4A03C]">{c.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[10px] text-[#8A94A6] truncate">{c.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#D4A03C]">${c.totalSpent.toFixed(2)}</p>
                <p className="text-[10px] text-[#8A94A6]">{c.totalOrders} order{c.totalOrders !== 1 ? "s" : ""}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Inventory Report ─── */
function InventoryTab() {
  const { data: productsData } = trpc.product.list.useQuery({ limit: 500 });
  const products = productsData?.products ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "in">("all");

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "low") return p.stockQuantity > 0 && p.stockQuantity < 5;
    if (filter === "out") return p.stockQuantity === 0;
    if (filter === "in") return p.stockQuantity >= 5;
    return true;
  });

  const totalStockValue = products.reduce((sum, p) => sum + Number(p.price) * p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 5).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
  const totalUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);

  const stockStatusColors: Record<string, string> = {
    low: "text-orange-400",
    out: "text-[#E53935]",
    in: "text-green-400",
  };

  const handleExportCSV = () => {
    const header = "Name,Category,Price,Stock,Value,SKU,Badge,Active\n";
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`, p.category, Number(p.price).toFixed(2), p.stockQuantity,
      (Number(p.price) * p.stockQuantity).toFixed(2), p.sku ?? "", p.badge ?? "", p.isActive ? "Yes" : "No",
    ].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pacifika-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#243656] rounded-lg pl-9 pr-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
      </div>

      <button onClick={handleExportCSV}
        className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
        <Download size={16} /> Export Inventory CSV
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Stock Value</p>
          <p className="text-xl font-bold text-[#D4A03C]">${totalStockValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Total Units</p>
          <p className="text-xl font-bold">{totalUnits}</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Low Stock</p>
          <p className="text-xl font-bold text-orange-400">{lowStockCount}</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Out of Stock</p>
          <p className="text-xl font-bold text-[#E53935]">{outOfStockCount}</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {[
          { key: "all" as const, label: "All", count: products.length },
          { key: "low" as const, label: "Low Stock", count: lowStockCount },
          { key: "out" as const, label: "Out of Stock", count: outOfStockCount },
          { key: "in" as const, label: "In Stock", count: products.length - lowStockCount - outOfStockCount },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1.5 ${filter === f.key ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"}`}>
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-[#1B2A4A]/20" : "bg-[#1B2A4A]/50"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#243656] rounded-xl p-8 text-center">
            <Warehouse size={32} className="text-[#8A94A6] mx-auto mb-3" />
            <p className="text-[#8A94A6] text-sm">No products match</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-[#243656] rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                <LazyImage src={Array.isArray(p.images) ? p.images[0] : ""} alt={p.name} className="w-12 h-12" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                <p className="text-xs text-[#8A94A6]">{p.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold ${stockStatusColors[p.stockQuantity === 0 ? "out" : p.stockQuantity < 5 ? "low" : "in"]}`}>
                    {p.stockQuantity} units
                  </span>
                  <span className="text-[10px] text-[#8A94A6]">@ ${Number(p.price).toFixed(2)}</span>
                  <span className="text-xs font-bold text-[#D4A03C]">= ${(Number(p.price) * p.stockQuantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


/* ─── Collections ─── */
function CollectionsTab() {
  const { data, refetch } = trpc.collection.adminList.useQuery();
  const createCollection = trpc.collection.create.useMutation({ onSuccess: () => refetch() });
  const updateCollection = trpc.collection.update.useMutation({ onSuccess: () => refetch() });
  const deleteCollection = trpc.collection.delete.useMutation({ onSuccess: () => refetch() });
  const setProducts = trpc.collection.setProducts.useMutation({ onSuccess: () => refetch() });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const allCollections = data ?? [];
  const { data: allProductsData } = trpc.product.list.useQuery({ search: pickerSearch || undefined, limit: 50 });
  const allProducts = allProductsData?.products ?? [];

  const handleCreate = () => {
    if (!formName.trim() || !formSlug.trim()) return;
    createCollection.mutate({
      name: formName.trim(),
      slug: formSlug.trim(),
      description: formDesc.trim() || undefined,
      image: formImage.trim() || undefined,
    });
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !formName.trim()) return;
    updateCollection.mutate({
      id: editingId,
      name: formName.trim(),
      slug: formSlug.trim(),
      description: formDesc.trim() || undefined,
      image: formImage.trim() || undefined,
    });
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormImage("");
  };

  const startEdit = (c: (typeof allCollections)[0]) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormDesc(c.description ?? "");
    setFormImage(c.image ?? "");
    setShowForm(true);
  };

  const openProductPicker = (collectionId: number) => {
    setShowProductPicker(collectionId);
    setSelectedProductIds([]);
    setPickerSearch("");
  };

  const handleSaveProducts = () => {
    if (!showProductPicker || selectedProductIds.length === 0) return;
    setProducts.mutate({ collectionId: showProductPicker, productIds: selectedProductIds });
    setShowProductPicker(null);
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#8A94A6]">{allCollections.length} collection{allCollections.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#D4A03C] text-[#1B2A4A] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-[#243656] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">{editingId ? "Edit Collection" : "New Collection"}</h3>
          <div>
            <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Summer Collection"
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Slug</label>
            <input
              type="text"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="summer-collection"
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Cover Image URL</label>
            <input
              type="text"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={!formName.trim() || !formSlug.trim()}
              className="flex-1 bg-[#D4A03C] text-[#1B2A4A] py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {editingId ? "Save Changes" : "Create Collection"}
            </button>
            <button onClick={resetForm} className="bg-[#1B2A4A] px-4 py-2.5 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="space-y-3">
        {allCollections.map((c) => (
          <div key={c.id} className="bg-[#243656] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.isActive ? "bg-green-500/20 text-green-400" : "bg-[#8A94A6]/20 text-[#8A94A6]"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[10px] text-[#8A94A6] font-mono mt-0.5">/{c.slug}</p>
                {c.description && <p className="text-xs text-[#8A94A6] mt-1 line-clamp-1">{c.description}</p>}
                <p className="text-[10px] text-[#D4A03C] mt-1">{c.productCount} product{c.productCount !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(c)} className="p-1.5 text-[#8A94A6] hover:text-[#5BA4CF]">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if (confirm("Delete this collection?")) deleteCollection.mutate({ id: c.id }); }} className="p-1.5 text-[#8A94A6] hover:text-[#E53935]">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openProductPicker(c.id)}
                className="text-xs text-[#5BA4CF] bg-[#5BA4CF]/10 px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <LayoutGrid size={12} /> Manage Products
              </button>
              <button
                onClick={() => updateCollection.mutate({ id: c.id, isActive: !c.isActive })}
                className="text-xs text-[#8A94A6] bg-[#1B2A4A] px-3 py-1.5 rounded-lg"
              >
                {c.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowProductPicker(null)} />
          <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0F1923] px-4 pt-4 pb-3 border-b border-[#243656] z-10">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Products</h3>
                <button onClick={() => setShowProductPicker(null)} className="p-2"><X size={18} /></button>
              </div>
              <p className="text-xs text-[#8A94A6] mt-1">{selectedProductIds.length} selected</p>
            </div>
            <div className="px-4 py-3">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-[#243656] rounded-lg pl-8 pr-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {allProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                        } else {
                          setSelectedProductIds([...selectedProductIds, p.id]);
                        }
                      }}
                      className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition-colors ${isSelected ? "bg-[#D4A03C]/20 border border-[#D4A03C]/30" : "hover:bg-[#243656]"}`}
                    >
                      <div className="w-8 h-8 rounded bg-[#243656] overflow-hidden flex-shrink-0">
                        {Array.isArray(p.images) && p.images[0] && (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-[#8A94A6]">{p.category} · ${Number(p.price).toFixed(2)}</p>
                      </div>
                      {isSelected && <CheckCircle size={14} className="text-[#D4A03C] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSaveProducts}
                disabled={selectedProductIds.length === 0}
                className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3 rounded-lg font-semibold text-sm mt-3 disabled:opacity-50"
              >
                Save {selectedProductIds.length} Product{selectedProductIds.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Revenue Analytics ─── */
function RevenueTab() {
  const { data: categoryData, isLoading: catLoading } = trpc.analytics.revenueByCategory.useQuery();
  const { data: repeatData, isLoading: repLoading } = trpc.analytics.repeatCustomerRate.useQuery();
  const { data: aovData, isLoading: aovLoading } = trpc.analytics.aovOverTime.useQuery({ months: 6 });
  const { data: topCustomersData, isLoading: tcLoading } = trpc.analytics.topCustomers.useQuery({ limit: 10 });

  const isLoading = catLoading || repLoading || aovLoading || tcLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#243656] rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-[#243656] rounded-xl p-4 h-56 animate-pulse" />
        <div className="bg-[#243656] rounded-xl p-4 h-56 animate-pulse" />
      </div>
    );
  }

  const categories = categoryData ?? [];
  const totalCategoryRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);

  const categoryColors: Record<string, string> = {
    dresses: "#D4A03C",
    shirts: "#5BA4CF",
    puletasi: "#8B5CF6",
    kids: "#10B981",
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart size={16} className="text-[#D4A03C]" />
            <span className="text-xs text-[#8A94A6]">Categories</span>
          </div>
          <p className="text-xl font-bold">{categories.length}</p>
          <p className="text-[10px] text-[#8A94A6]">with sales</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={16} className="text-green-400" />
            <span className="text-xs text-[#8A94A6]">Repeat Rate</span>
          </div>
          <p className="text-xl font-bold text-green-400">{repeatData?.rate ?? 0}%</p>
          <p className="text-[10px] text-[#8A94A6]">{repeatData?.repeatCustomers ?? 0} of {repeatData?.totalCustomers ?? 0} customers</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#5BA4CF]" />
            <span className="text-xs text-[#8A94A6]">Current AOV</span>
          </div>
          <p className="text-xl font-bold text-[#5BA4CF]">
            ${aovData && aovData.length > 0 ? Number(aovData[aovData.length - 1].aov).toFixed(2) : "0.00"}
          </p>
          <p className="text-[10px] text-[#8A94A6]">per order</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-400" />
            <span className="text-xs text-[#8A94A6]">One-time</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{repeatData?.oneTimeCustomers ?? 0}</p>
          <p className="text-[10px] text-[#8A94A6]">single purchase</p>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-[#243656] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Revenue by Category</h3>
        {categories.length === 0 ? (
          <p className="text-xs text-[#8A94A6] text-center py-4">No category data yet</p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = totalCategoryRevenue > 0 ? (cat.revenue / totalCategoryRevenue) * 100 : 0;
              const color = categoryColors[cat.category] ?? "#8A94A6";
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium capitalize">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#8A94A6]">{cat.units} units</span>
                      <span className="text-xs font-bold" style={{ color }}>${Number(cat.revenue).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#1B2A4A] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
            <div className="border-t border-[#8A94A6]/10 pt-2 flex justify-between">
              <span className="text-xs text-[#8A94A6]">Total</span>
              <span className="text-sm font-bold text-[#D4A03C]">${totalCategoryRevenue.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* AOV Over Time */}
      <div className="bg-[#243656] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Avg. Order Value (6 Months)</h3>
        {aovData && aovData.length > 0 ? (
          <div className="space-y-2">
            {aovData.map((d) => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-[10px] text-[#8A94A6] w-16 flex-shrink-0">{d.month}</span>
                <div className="flex-1 h-6 bg-[#1B2A4A] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-[#5BA4CF]/40 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, (Number(d.aov) / 200) * 100)}%` }}
                  >
                    <span className="text-[10px] font-bold text-[#5BA4CF]">${Number(d.aov).toFixed(0)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#8A94A6] w-8 text-right">{d.orders}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8A94A6] text-center py-4">No data yet</p>
        )}
      </div>

      {/* Top Customers */}
      <div className="bg-[#243656] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Top Customers</h3>
        {topCustomersData && topCustomersData.length > 0 ? (
          <div className="space-y-2">
            {topCustomersData.map((c, i) => (
              <div key={c.email} className="flex items-center gap-3">
                <span className="text-xs text-[#D4A03C] font-bold w-4">{i + 1}</span>
                <div className="w-8 h-8 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#D4A03C]">{(c.name ?? "?").charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name ?? c.email}</p>
                  <p className="text-[10px] text-[#8A94A6]">{c.orders} orders</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[#D4A03C]">${Number(c.total).toFixed(2)}</p>
                  <p className="text-[10px] text-[#8A94A6]">{c.lastOrder}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8A94A6] text-center py-4">No customer data yet</p>
        )}
      </div>
    </div>
  );
}


/* ─── Conversion Funnel ─── */
function FunnelTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = trpc.funnel.getFunnel.useQuery({ days });
  const { data: trendData } = trpc.funnel.getTrend.useQuery({ days: 14 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#243656] rounded-xl p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const stages = data?.stages ?? [];
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const colors = ["#5BA4CF", "#8B5CF6", "#D4A03C", "#10B981"];

  return (
    <div className="space-y-5 pb-8">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              days === d ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
            }`}
          >
            {d} Days
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Overall Conversion</p>
          <p className="text-2xl font-bold text-[#10B981]">{data?.overallConversion ?? 0}%</p>
          <p className="text-[10px] text-[#8A94A6]">shop view to purchase</p>
        </div>
        <div className="bg-[#243656] rounded-xl p-4">
          <p className="text-xs text-[#8A94A6] mb-1">Purchases</p>
          <p className="text-2xl font-bold text-[#D4A03C]">{data?.purchaseCount ?? 0}</p>
          <p className="text-[10px] text-[#8A94A6]">${(data?.totalRevenue ?? 0).toFixed(2)} revenue</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-[#243656] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Sales Funnel</h3>
        {stages.length === 0 ? (
          <p className="text-xs text-[#8A94A6] text-center py-8">No funnel data yet. Events will appear as customers browse your store.</p>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const width = Math.max(20, (stage.count / maxCount) * 100);
              const prevStage = i > 0 ? stages[i - 1] : null;
              const dropOff = prevStage && prevStage.count > 0
                ? Math.round(((prevStage.count - stage.count) / prevStage.count) * 100)
                : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium flex items-center gap-1.5">
                          {stage.key === "page_view" && <ShoppingCart size={12} className="text-[#5BA4CF]" />}
                          {stage.key === "add_to_cart" && <ShoppingBag size={12} className="text-[#8B5CF6]" />}
                          {stage.key === "begin_checkout" && <Tag size={12} className="text-[#D4A03C]" />}
                          {stage.key === "purchase" && <CheckCircle size={12} className="text-[#10B981]" />}
                          {stage.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {i > 0 && dropOff > 0 && (
                            <span className="text-[10px] text-[#E53935]">-{dropOff}%</span>
                          )}
                          <span className="text-xs font-bold">{stage.count.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-8 bg-[#1B2A4A] rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${width}%`, backgroundColor: colors[i] + "30", borderRight: `2px solid ${colors[i]}` }}
                        >
                          {(stage.conversionRate ?? 0) > 0 && (
                            <span className="text-[10px] font-bold" style={{ color: colors[i] }}>{stage.conversionRate}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop-off Details */}
      {data?.dropOffs && data.dropOffs.length > 0 && (
        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Drop-off Analysis</h3>
          <div className="space-y-2">
            {data.dropOffs.map((d) => (
              <div key={d.from} className="flex items-center justify-between py-2 border-b border-[#8A94A6]/5 last:border-0">
                <span className="text-xs text-[#8A94A6]">{d.from} → {d.to}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#E53935]">{d.dropped} lost</span>
                  <span className="text-xs font-bold text-[#E53935]">{d.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Trend */}
      {trendData && trendData.length > 0 && (
        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Daily Activity (14 Days)</h3>
          <div className="space-y-1">
            {Array.from(new Set(trendData.map((d) => d.date))).slice(-14).map((date) => {
              const dayData = trendData.filter((d) => d.date === date);
              const pv = dayData.find((d) => d.type === "page_view")?.count ?? 0;
              const atc = dayData.find((d) => d.type === "add_to_cart")?.count ?? 0;
              const pur = dayData.find((d) => d.type === "purchase")?.count ?? 0;
              return (
                <div key={date} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-[#8A94A6] w-20 flex-shrink-0">{date}</span>
                  <div className="flex-1 flex gap-0.5 h-4">
                    <div className="bg-[#5BA4CF]/40 rounded-sm" style={{ width: `${Math.max(5, (pv / (Math.max(pv, 1))) * 33)}%` }} title={`Views: ${pv}`} />
                    <div className="bg-[#8B5CF6]/40 rounded-sm" style={{ width: `${Math.max(5, (atc / (Math.max(pv, 1))) * 33)}%` }} title={`Cart: ${atc}`} />
                    <div className="bg-[#10B981]/40 rounded-sm" style={{ width: `${Math.max(5, (pur / (Math.max(pv, 1))) * 33)}%` }} title={`Purchase: ${pur}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="text-[10px] text-[#8A94A6] flex items-center gap-1"><span className="w-2 h-2 bg-[#5BA4CF]/40 rounded-sm" /> Views</span>
            <span className="text-[10px] text-[#8A94A6] flex items-center gap-1"><span className="w-2 h-2 bg-[#8B5CF6]/40 rounded-sm" /> Cart</span>
            <span className="text-[10px] text-[#8A94A6] flex items-center gap-1"><span className="w-2 h-2 bg-[#10B981]/40 rounded-sm" /> Purchase</span>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Lookbook Admin ─── */
function LookbookAdminTab() {
  const { data, refetch } = trpc.lookbook.adminList.useQuery();
  const createItem = trpc.lookbook.create.useMutation({ onSuccess: () => refetch() });
  const updateItem = trpc.lookbook.update.useMutation({ onSuccess: () => refetch() });
  const deleteItem = trpc.lookbook.delete.useMutation({ onSuccess: () => refetch() });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formSort, setFormSort] = useState(0);

  const allItems = data ?? [];

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormDesc("");
    setFormImage("");
    setFormSort(0);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formImage.trim()) return;
    if (editingId) {
      updateItem.mutate({ id: editingId, title: formTitle.trim(), description: formDesc.trim() || undefined, image: formImage.trim(), sortOrder: formSort });
    } else {
      createItem.mutate({ title: formTitle.trim(), description: formDesc.trim() || undefined, image: formImage.trim(), sortOrder: formSort });
    }
    resetForm();
  };

  const startEdit = (item: NonNullable<typeof data>[0]) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDesc(item.description ?? "");
    setFormImage(item.image);
    setFormSort(item.sortOrder ?? 0);
    setShowForm(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#8A94A6]">{allItems.length} item{allItems.length !== 1 ? "s" : ""}</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#D4A03C] text-[#1B2A4A] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
          <Plus size={16} /> New
        </button>
      </div>

      {showForm && (
        <div className="bg-[#243656] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">{editingId ? "Edit Lookbook Item" : "New Lookbook Item"}</h3>
          <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Title *" className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
          <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description" rows={2} className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none" />
          <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)} placeholder="Image URL *" className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none" />
          {formImage && <img src={formImage} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!formTitle.trim() || !formImage.trim()} className="flex-1 bg-[#D4A03C] text-[#1B2A4A] py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">{editingId ? "Save" : "Create"}</button>
            <button onClick={resetForm} className="bg-[#1B2A4A] px-4 py-2.5 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {allItems.map((item) => (
          <div key={item.id} className="bg-[#243656] rounded-xl overflow-hidden">
            <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.isActive ? "bg-green-500/20 text-green-400" : "bg-[#8A94A6]/20 text-[#8A94A6]"}`}>{item.isActive ? "Active" : "Hidden"}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(item)} className="p-1.5 text-[#8A94A6] hover:text-[#5BA4CF]"><Edit2 size={14} /></button>
                  <button onClick={() => { if (confirm("Delete?")) deleteItem.mutate({ id: item.id }); }} className="p-1.5 text-[#8A94A6] hover:text-[#E53935]"><Trash2 size={14} /></button>
                </div>
              </div>
              {item.description && <p className="text-xs text-[#8A94A6] mt-1 line-clamp-1">{item.description}</p>}
              <button onClick={() => updateItem.mutate({ id: item.id, isActive: !item.isActive })} className="text-xs text-[#5BA4CF] mt-2">{item.isActive ? "Hide" : "Show"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
