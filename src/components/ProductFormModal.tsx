import { useState, useEffect } from "react";
import { X, Plus, Loader2, Search, Link as LinkIcon, Play } from "lucide-react";
import { trpc } from "@/providers/trpc";
import ImageUploader from "./ImageUploader";

const CATEGORIES = [
  { value: "dresses", label: "Island Dresses" },
  { value: "shirts", label: "Shirts" },
  { value: "puletasi", label: "Family Sets" },
  { value: "kids", label: "Kids" },
];

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: "dresses" | "shirts" | "puletasi" | "kids";
  price: string;
  salePrice: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  stockQuantity: string;
  sku: string;
  weightGrams: string;
  featured: boolean;
  isActive: boolean;
  badge: "" | "new" | "bestseller" | "limited";
  sizeStock: string;
  metaTitle: string;
  metaDescription: string;
  relatedProductIds: number[];
  videoUrls: string[];
}

const emptyForm: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  category: "dresses",
  price: "",
  salePrice: "",
  images: [],
  sizes: [],
  colors: [],
  stockQuantity: "10",
  sku: "",
  weightGrams: "500",
  featured: false,
  isActive: true,
  badge: "",
  sizeStock: "",
  metaTitle: "",
  metaDescription: "",
  relatedProductIds: [],
  videoUrls: [],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProduct?: {
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
    metaTitle?: string | null;
    metaDescription?: string | null;
    relatedProductIds?: number[] | null;
  } | null;
}

export default function ProductFormModal({ isOpen, onClose, onSuccess, editProduct }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [sizeInput, setSizeInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#D4A03C");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [showRelatedPicker, setShowRelatedPicker] = useState(false);

  const utils = trpc.useUtils();
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      onSuccess();
      onClose();
    },
  });
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      onSuccess();
      onClose();
    },
  });

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        slug: editProduct.slug,
        description: editProduct.description ?? "",
        category: editProduct.category,
        price: editProduct.price.toString(),
        salePrice: editProduct.salePrice?.toString() ?? "",
        images: Array.isArray(editProduct.images) ? editProduct.images : [],
        sizes: Array.isArray(editProduct.sizes) ? editProduct.sizes : [],
        colors: editProduct.colors ?? [],
        stockQuantity: editProduct.stockQuantity.toString(),
        sku: editProduct.sku ?? "",
        weightGrams: editProduct.weightGrams?.toString() ?? "500",
        featured: editProduct.featured ?? false,
        isActive: editProduct.isActive ?? true,
        badge: editProduct.badge ?? "",
        sizeStock: (editProduct as Record<string, unknown>).sizeStock as string ?? "",
        metaTitle: editProduct.metaTitle ?? "",
        metaDescription: editProduct.metaDescription ?? "",
        relatedProductIds: editProduct.relatedProductIds ?? [],
        videoUrls: (editProduct as Record<string, unknown>).videoUrls as string[] ?? [],
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [editProduct, isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!editProduct && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }));
    }
  }, [form.name, editProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.slug || !form.price || form.images.length === 0) {
      setError("Name, slug, price, and at least one image are required.");
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Price must be a positive number.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        category: form.category,
        price: priceNum,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        images: form.images,
        sizes: form.sizes,
        colors: form.colors.length > 0 ? form.colors : undefined,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        sku: form.sku || undefined,
        weightGrams: parseInt(form.weightGrams) || 500,
        badge: form.badge || undefined,
        sizeStock: form.sizeStock || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        relatedProductIds: form.relatedProductIds.length > 0 ? form.relatedProductIds : undefined,
        videoUrls: form.videoUrls.length > 0 ? form.videoUrls : undefined,
      };

      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addSize = () => {
    const s = sizeInput.trim().toUpperCase();
    if (s && !form.sizes.includes(s)) {
      setForm({ ...form, sizes: [...form.sizes, s] });
      setSizeInput("");
    }
  };

  const removeSize = (s: string) => {
    setForm({ ...form, sizes: form.sizes.filter((x) => x !== s) });
  };

  const addColor = () => {
    const name = colorName.trim();
    if (name && !form.colors.find((c) => c.name === name)) {
      setForm({ ...form, colors: [...form.colors, { name, hex: colorHex }] });
      setColorName("");
    }
  };

  const removeColor = (name: string) => {
    setForm({ ...form, colors: form.colors.filter((c) => c.name !== name) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="sticky top-0 z-10 bg-[#0F1923] px-4 pt-3 pb-2 border-b border-[#243656]">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
              {editProduct ? "Edit Product" : "Add Product"}
            </h2>
            <button onClick={onClose} className="p-2">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          {error && (
            <div className="bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg p-3 text-xs text-[#E53935]">
              {error}
            </div>
          )}

          {/* Images */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block">Product Images *</label>
            <ImageUploader images={form.images} onChange={(imgs) => setForm({ ...form, images: imgs })} />
          </div>

          {/* Video URLs */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block flex items-center gap-1">
              <Play size={12} /> Product Videos
            </label>
            {form.videoUrls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...form.videoUrls];
                    newUrls[i] = e.target.value;
                    setForm({ ...form, videoUrls: newUrls });
                  }}
                  placeholder="https://..."
                  className="flex-1 bg-[#243656] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, videoUrls: form.videoUrls.filter((_, idx) => idx !== i) })}
                  className="px-3 py-2 text-[#E53935] text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            {form.videoUrls.length < 3 && (
              <button
                type="button"
                onClick={() => setForm({ ...form, videoUrls: [...form.videoUrls, ""] })}
                className="text-xs text-[#5BA4CF] flex items-center gap-1"
              >
                <Plus size={12} /> Add Video URL
              </button>
            )}
            <p className="text-[10px] text-[#8A94A6] mt-1">Max 3 videos. Paste direct video URLs (MP4, WebM).</p>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              placeholder="e.g., Hibiscus Island Dress"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">URL Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
              placeholder="hibiscus-island-dress"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none"
              placeholder="Product description..."
            />
          </div>

          {/* Price & Sale */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Price (AUD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                placeholder="89.99"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Sale Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block">Sizes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.sizes.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 bg-[#243656] px-3 py-1.5 rounded-full text-xs">
                  {s}
                  <button type="button" onClick={() => removeSize(s)} className="text-[#E53935]">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                className="flex-1 bg-[#243656] rounded-lg px-4 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                placeholder="e.g., S, M, L, XL"
              />
              <button type="button" onClick={addSize} className="bg-[#243656] px-3 rounded-lg">
                <Plus size={16} className="text-[#D4A03C]" />
              </button>
            </div>
          </div>

          {/* Per-Size Stock */}
          {form.sizes.length > 0 && (
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block">Stock per Size</label>
              <div className="grid grid-cols-3 gap-2">
                {form.sizes.map((s) => {
                  const stockMap: Record<string, string> = form.sizeStock ? JSON.parse(form.sizeStock) : {};
                  return (
                    <div key={s}>
                      <label className="text-[10px] text-[#8A94A6] mb-0.5 block">{s}</label>
                      <input
                        type="number"
                        min="0"
                        value={stockMap[s] ?? form.stockQuantity}
                        onChange={(e) => {
                          const map = form.sizeStock ? JSON.parse(form.sizeStock) : {};
                          map[s] = e.target.value;
                          setForm({ ...form, sizeStock: JSON.stringify(map) });
                        }}
                        className="w-full bg-[#243656] rounded-lg px-3 py-2 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#8A94A6] mt-1">Leave as default to use the main stock quantity.</p>
            </div>
          )}

          {/* Colors */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.colors.map((c) => (
                <span key={c.name} className="inline-flex items-center gap-1.5 bg-[#243656] px-3 py-1.5 rounded-full text-xs">
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                  {c.name}
                  <button type="button" onClick={() => removeColor(c.name)} className="text-[#E53935]">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                className="flex-1 bg-[#243656] rounded-lg px-4 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                placeholder="Color name"
              />
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer"
              />
              <button type="button" onClick={addColor} className="bg-[#243656] px-3 rounded-lg">
                <Plus size={16} className="text-[#D4A03C]" />
              </button>
            </div>
          </div>

          {/* Stock, SKU, Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="w-full bg-[#243656] rounded-lg px-3 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full bg-[#243656] rounded-lg px-3 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none font-mono"
                placeholder="DRE-001"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-1 block">Weight (g)</label>
              <input
                type="number"
                min="0"
                value={form.weightGrams}
                onChange={(e) => setForm({ ...form, weightGrams: e.target.value })}
                className="w-full bg-[#243656] rounded-lg px-3 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="text-xs text-[#8A94A6] uppercase tracking-wider mb-2 block">Product Badge</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "", label: "None" },
                { value: "new", label: "New", class: "bg-[#5BA4CF]/20 text-[#5BA4CF] border-[#5BA4CF]/40" },
                { value: "bestseller", label: "Bestseller", class: "bg-[#D4A03C]/20 text-[#D4A03C] border-[#D4A03C]/40" },
                { value: "limited", label: "Limited", class: "bg-[#E53935]/20 text-[#E53935] border-[#E53935]/40" },
              ].map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setForm({ ...form, badge: b.value as typeof form.badge })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.badge === b.value ? b.class : "bg-[#243656] text-[#8A94A6] border-transparent"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* SEO - Meta Tags */}
          <div className="border-t border-[#8A94A6]/10 pt-4">
            <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <LinkIcon size={12} /> SEO / Meta Tags
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Meta Title</label>
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder={form.name || "e.g., Hibiscus Island Dress | Pacifika Wear"}
                  className="w-full bg-[#243656] rounded-lg px-4 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                />
                <p className="text-[10px] text-[#8A94A6] mt-0.5">{form.metaTitle.length}/60 characters</p>
              </div>
              <div>
                <label className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1 block">Meta Description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Short description for search engines..."
                  rows={2}
                  className="w-full bg-[#243656] rounded-lg px-4 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none"
                />
                <p className="text-[10px] text-[#8A94A6] mt-0.5">{form.metaDescription.length}/160 characters</p>
              </div>
              {/* SEO Preview */}
              {(form.metaTitle || form.metaDescription || form.name) && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-[10px] text-[#8A94A6] uppercase mb-1.5">Google Preview</p>
                  <p className="text-xs text-[#1A0DAB] font-medium line-clamp-1">{form.metaTitle || form.name}</p>
                  <p className="text-[10px] text-[#006621] mt-0.5">pacifikawear.com › product › {form.slug}</p>
                  <p className="text-[10px] text-[#545454] line-clamp-2 mt-0.5">{form.metaDescription || form.description || "No description set."}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {editProduct && (
            <div className="border-t border-[#8A94A6]/10 pt-4">
              <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Related Products</h3>
              <p className="text-[10px] text-[#8A94A6] mb-2">Curate which products appear in "You May Also Like"</p>

              {/* Selected related products */}
              {form.relatedProductIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <RelatedProductTags ids={form.relatedProductIds} onRemove={(id) => setForm({ ...form, relatedProductIds: form.relatedProductIds.filter((rid) => rid !== id) })} />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowRelatedPicker(!showRelatedPicker)}
                className="text-xs text-[#5BA4CF] flex items-center gap-1"
              >
                <Plus size={12} /> {showRelatedPicker ? "Close" : "Add Related Products"}
              </button>

              {showRelatedPicker && (
                <div className="mt-3 bg-[#1B2A4A] rounded-xl p-3 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A6]" />
                    <input
                      type="text"
                      value={relatedSearch}
                      onChange={(e) => setRelatedSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-[#243656] rounded-lg pl-8 pr-3 py-2 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
                    />
                  </div>
                  <RelatedProductPicker
                    search={relatedSearch}
                    selectedIds={form.relatedProductIds}
                    currentId={editProduct.id}
                    onSelect={(id) => {
                      if (!form.relatedProductIds.includes(id) && form.relatedProductIds.length < 4) {
                        setForm({ ...form, relatedProductIds: [...form.relatedProductIds, id] });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded accent-[#D4A03C]"
              />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-[#D4A03C]"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 sticky bottom-0"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              editProduct ? "Save Changes" : "Add Product"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Related Product Tags (show selected) ─── */
function RelatedProductTags({ ids, onRemove }: { ids: number[]; onRemove: (id: number) => void }) {
  const { data } = trpc.product.list.useQuery({ limit: 200 });
  const products = data?.products ?? [];
  const selected = products.filter((p) => ids.includes(p.id));

  return (
    <>
      {selected.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1 bg-[#D4A03C]/20 text-[#D4A03C] px-2 py-1 rounded-lg text-[10px]">
          {p.name}
          <button type="button" onClick={() => onRemove(p.id)} className="hover:text-[#E53935]">
            <X size={10} />
          </button>
        </span>
      ))}
    </>
  );
}

/* ─── Related Product Picker ─── */
function RelatedProductPicker({
  search,
  selectedIds,
  currentId,
  onSelect,
}: {
  search: string;
  selectedIds: number[];
  currentId: number;
  onSelect: (id: number) => void;
}) {
  const { data, isLoading } = trpc.product.list.useQuery({ search: search || undefined, limit: 20 });
  const products = (data?.products ?? []).filter(
    (p) => p.id !== currentId && !selectedIds.includes(p.id)
  );

  if (isLoading) {
    return <div className="text-xs text-[#8A94A6] py-2">Loading...</div>;
  }

  if (products.length === 0) {
    return <div className="text-xs text-[#8A94A6] py-2">No products found</div>;
  }

  return (
    <div className="max-h-40 overflow-y-auto space-y-1">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-[#243656] transition-colors"
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
          <Plus size={14} className="text-[#5BA4CF] flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}
