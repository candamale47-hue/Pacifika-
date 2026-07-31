import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ShoppingBag, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import LazyImage from "@/components/LazyImage";

export default function Lookbook() {
  const navigate = useNavigate();
  const { data: items } = trpc.lookbook.list.useQuery();
  const [selectedItem, setSelectedItem] = useState<NonNullable<typeof items>[0] | null>(null);

  const lookbookItems = items ?? [];

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>Lookbook</h1>
          <p className="text-[10px] text-[#8A94A6]">Pacifika Island Fashion</p>
        </div>
      </header>

      {/* Gallery Grid */}
      <div className="px-4 mt-4 space-y-6">
        {lookbookItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8A94A6] text-sm">Lookbook coming soon</p>
          </div>
        ) : (
          lookbookItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="w-full text-left block rounded-2xl overflow-hidden bg-[#1B2A4A] active:scale-[0.98] transition-transform"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <LazyImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-white/70 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-lg bg-[#0F1923] rounded-t-2xl max-h-[85vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
            >
              <X size={16} className="text-white" />
            </button>

            {/* Hero Image */}
            <div className="aspect-[4/5] relative">
              <LazyImage src={selectedItem.image} alt={selectedItem.title} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="px-4 pb-6 -mt-16 relative z-10">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                {selectedItem.title}
              </h2>
              {selectedItem.description && (
                <p className="text-sm text-[#8A94A6] mt-2 leading-relaxed">{selectedItem.description}</p>
              )}
              <button
                onClick={() => { setSelectedItem(null); navigate("/shop"); }}
                className="w-full mt-6 bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Shop This Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
