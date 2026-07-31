import { useState } from "react";
import { FileText, Send, TrendingUp, ShoppingBag, DollarSign, Package, Calendar } from "lucide-react";
import { trpc } from "@/providers/trpc";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportsTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = trpc.order.monthlyReport.useQuery({ year, month });

  const handleEmailReport = () => {
    if (!data) return;
    const subject = encodeURIComponent(`Monthly Order Report - ${data.monthName} ${data.year} - Pacifika Wear`);
    const body = encodeURIComponent(buildReportText(data));
    window.open(`mailto:joelandamale@gmail.com?subject=${subject}&body=${body}`);
  };

  const buildReportText = (d: NonNullable<typeof data>) => {
    const statusLines = Object.entries(d.statusCounts)
      .map(([status, count]) => `  ${status}: ${count}`)
      .join("\n");

    const topProductsLines = d.topProducts
      .map((p, i) => `  ${i + 1}. ${p.name} - Qty: ${p.quantity}, Revenue: $${p.revenue.toFixed(2)}`)
      .join("\n");

    const orderLines = d.orders
      .map((o) => `  ${o.orderNumber} | ${o.shippingName} | $${Number(o.total).toFixed(2)} | ${o.status}`)
      .join("\n");

    return `PACIFIKA WEAR - MONTHLY ORDER REPORT\n${d.monthName} ${d.year}\n\n========================================\n\nSUMMARY\n-------\nTotal Orders: ${d.totalOrders}\nActive Orders: ${d.activeOrders}\nCancelled Orders: ${d.cancelledOrders}\nTotal Revenue: $${d.totalRevenue.toFixed(2)}\nAverage Order Value: $${d.avgOrderValue.toFixed(2)}\n\n========================================\n\nORDER STATUS BREAKDOWN\n----------------------\n${statusLines}\n\n========================================\n\nTOP PRODUCTS\n------------\n${topProductsLines || "  No sales data"}\n\n========================================\n\nALL ORDERS\n----------\n${orderLines || "  No orders"}\n\n========================================\n\nGenerated: ${new Date().toLocaleDateString("en-AU")}\nPacifika Wear - pacifika-wear.com`;
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Month Selector */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="appearance-none w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A94A6] pointer-events-none" />
        </div>
        <div className="relative w-28">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="appearance-none w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#243656] rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Email Button */}
          <button
            onClick={handleEmailReport}
            className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Send size={16} /> Email Report to Joel
          </button>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-[#D4A03C]" />
                <span className="text-xs text-[#8A94A6]">Revenue</span>
              </div>
              <p className="text-xl font-bold text-[#D4A03C]">${data.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={16} className="text-[#5BA4CF]" />
                <span className="text-xs text-[#8A94A6]">Orders</span>
              </div>
              <p className="text-xl font-bold">{data.activeOrders}</p>
            </div>
            <div className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-xs text-[#8A94A6]">Avg Order</span>
              </div>
              <p className="text-xl font-bold">${data.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-[#243656] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-orange-400" />
                <span className="text-xs text-[#8A94A6]">Cancelled</span>
              </div>
              <p className="text-xl font-bold text-orange-400">{data.cancelledOrders}</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-[#243656] rounded-xl p-4">
            <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Status Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(data.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs capitalize">{status.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <div className="flex-1 h-2 bg-[#1B2A4A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4A03C] rounded-full"
                        style={{ width: `${data.totalOrders > 0 ? (count / data.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          {data.topProducts.length > 0 && (
            <div className="bg-[#243656] rounded-xl p-4">
              <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Top Products</h3>
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
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

          {/* Orders List */}
          {data.orders.length > 0 && (
            <div className="bg-[#243656] rounded-xl p-4">
              <h3 className="text-xs text-[#8A94A6] uppercase tracking-wider mb-3">Orders ({data.orders.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#8A94A6]/10 last:border-0">
                    <div>
                      <p className="text-xs font-mono text-[#D4A03C]">{o.orderNumber}</p>
                      <p className="text-[10px] text-[#8A94A6]">{o.shippingName}</p>
                    </div>
                    <span className="text-xs font-bold">${Number(o.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.orders.length === 0 && (
            <div className="bg-[#243656] rounded-xl p-8 text-center">
              <FileText size={32} className="text-[#8A94A6] mx-auto mb-3" />
              <p className="text-[#8A94A6] text-sm">No orders for {data.monthName} {data.year}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
