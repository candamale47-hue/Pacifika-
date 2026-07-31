import { X } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

const dressSizes = [
  { size: "XS", chest: "82-86", waist: "64-68", hip: "90-94", length: "95" },
  { size: "S", chest: "86-90", waist: "68-72", hip: "94-98", length: "97" },
  { size: "M", chest: "90-96", waist: "72-78", hip: "98-104", length: "99" },
  { size: "L", chest: "96-102", waist: "78-84", hip: "104-110", length: "101" },
  { size: "XL", chest: "102-108", waist: "84-90", hip: "110-116", length: "103" },
  { size: "2XL", chest: "108-114", waist: "90-96", hip: "116-122", length: "105" },
];

const shirtSizes = [
  { size: "XS", chest: "86-90", shoulder: "42", sleeve: "20", length: "68" },
  { size: "S", chest: "90-94", shoulder: "44", sleeve: "21", length: "70" },
  { size: "M", chest: "94-100", shoulder: "46", sleeve: "22", length: "72" },
  { size: "L", chest: "100-106", shoulder: "48", sleeve: "23", length: "74" },
  { size: "XL", chest: "106-112", shoulder: "50", sleeve: "24", length: "76" },
  { size: "2XL", chest: "112-118", shoulder: "52", sleeve: "25", length: "78" },
];

const kidsSizes = [
  { size: "2", age: "2Y", height: "92", chest: "52", waist: "50" },
  { size: "3", age: "3Y", height: "98", chest: "54", waist: "52" },
  { size: "4", age: "4Y", height: "104", chest: "56", waist: "54" },
  { size: "5", age: "5Y", height: "110", chest: "58", waist: "56" },
  { size: "6", age: "6Y", height: "116", chest: "60", waist: "58" },
  { size: "7", age: "7Y", height: "122", chest: "62", waist: "60" },
  { size: "8", age: "8Y", height: "128", chest: "64", waist: "62" },
  { size: "10", age: "10Y", height: "140", chest: "68", waist: "66" },
  { size: "12", age: "12Y", height: "152", chest: "72", waist: "70" },
];

export default function SizeGuideModal({ isOpen, onClose, category = "dresses" }: SizeGuideModalProps) {
  if (!isOpen) return null;

  const isKids = category === "kids";
  const isShirt = category === "shirts" || category === "puletasi";
  const sizes = isKids ? kidsSizes : isShirt ? shirtSizes : dressSizes;
  const headers = isKids
    ? ["Size", "Age", "Height (cm)", "Chest (cm)", "Waist (cm)"]
    : isShirt
      ? ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)", "Length (cm)"]
      : ["Size", "Bust (cm)", "Waist (cm)", "Hip (cm)", "Length (cm)"];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1B2A4A] rounded-t-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#8A94A6]/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Size Guide
          </h2>
          <button onClick={onClose} className="p-2 -mr-2">
            <X size={20} className="text-[#8A94A6]" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
          {[
            { key: "dresses", label: "Dresses" },
            { key: "shirts", label: "Shirts" },
            { key: "puletasi", label: "Family Sets" },
            { key: "kids", label: "Kids" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                category === tab.key ? "bg-[#D4A03C] text-[#1B2A4A]" : "bg-[#243656] text-[#8A94A6]"
              }`}
              onClick={() => { /* In practice this would be controlled by parent */ }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Size Table */}
        <div className="px-5 pb-4">
          <div className="bg-[#243656] rounded-xl overflow-hidden">
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
              {headers.map((h) => (
                <div key={h} className="px-2 py-2.5 text-[10px] font-semibold text-[#D4A03C] uppercase tracking-wider text-center border-b border-[#1B2A4A]">
                  {h}
                </div>
              ))}
              {sizes.map((row, i) => (
                Object.values(row).map((val, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`px-2 py-2.5 text-xs text-center ${i % 2 === 0 ? "bg-[#243656]" : "bg-[#1B2A4A]/50"}`}
                  >
                    {val}
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>

        {/* How to Measure */}
        <div className="px-5 pb-6">
          <h3 className="text-sm font-semibold mb-3">How to Measure</h3>
          <div className="space-y-2.5">
            {[
              { label: "Bust/Chest", desc: "Measure around the fullest part of your chest, keeping the tape level." },
              { label: "Waist", desc: "Measure around your natural waistline — the narrowest part of your torso." },
              { label: "Hip", desc: "Measure around the fullest part of your hips, about 20cm below your waist." },
              { label: "Length", desc: "Measure from the highest point of the shoulder to the hem." },
            ].map((tip) => (
              <div key={tip.label} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A03C] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">{tip.label}</p>
                  <p className="text-[11px] text-[#8A94A6]">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#8A94A6] mt-4 leading-relaxed">
            All measurements are in centimetres. If you are between sizes, we recommend sizing up for a more comfortable Pacific Island fit.
          </p>
        </div>
      </div>
    </div>
  );
}
