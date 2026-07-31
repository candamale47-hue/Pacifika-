import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Package, Search, XCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

const statusColors: Record<string, string> = {
  received: "bg-blue-500/20 text-blue-400",
  processing: "bg-orange-500/20 text-orange-400",
  shipped: "bg-sky-500/20 text-sky-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  pending_payment: "bg-yellow-500/20 text-yellow-400",
};

export default function Orders() {
  const navigate = useNavigate();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchNumber, setSearchNumber] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trackedOrder, setTrackedOrder] = useState<any>(null);

  const { data, isLoading } = trpc.order.list.useQuery();
  const trackQuery = trpc.order.getByNumber.useQuery(
    { orderNumber: searchNumber, email: searchEmail },
    { enabled: !!searchNumber && !!searchEmail }
  );

  const handleTrack = () => {
    if (trackQuery.data) {
      setTrackedOrder(trackQuery.data);
    }
  };

  const orders = data?.orders ?? [];
  const utils = trpc.useUtils();
  const cancelOrder = trpc.order.cancel.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
    },
  });

  const handleCancel = (orderNumber: string, email: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    cancelOrder.mutate({ orderNumber, email });
  };

  const canCancel = (status: string | null | undefined) => {
    return status === "pending_payment" || status === "received";
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>My Orders</h1>
      </header>

      {/* Track Order */}
      <div className="px-4 mt-4 mb-6">
        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Search size={14} className="text-[#5BA4CF]" />
            Track Order (Guest)
          </h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Order number (e.g., PW-XXXXXX)"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
            <input
              type="email"
              placeholder="Email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full bg-[#1B2A4A] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
            <button
              onClick={handleTrack}
              className="bg-[#5BA4CF] text-white py-2 rounded-lg text-sm font-medium"
            >
              Track Order
            </button>
          </div>
          {trackedOrder && (
            <Link
              to={`/track?order=${trackedOrder.orderNumber}&email=${searchEmail}`}
              className="block mt-2 text-[#5BA4CF] text-xs text-center"
            >
              View order details &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#243656] rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-[#1B2A4A] rounded w-1/3 mb-2" />
              <div className="h-3 bg-[#1B2A4A] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package size={48} className="text-[#8A94A6]/40 mb-4" />
          <p className="text-[#8A94A6]">No orders yet</p>
          <Link to="/shop" className="text-[#D4A03C] text-sm mt-2">Start Shopping</Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#243656] rounded-xl p-4">
              <Link
                to={`/track?order=${order.orderNumber}&email=${order.shippingEmail}`}
                className="block"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-mono text-[#D4A03C]">{order.orderNumber}</p>
                    <p className="text-xs text-[#8A94A6] mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status ?? "received"]}`}>
                    {order.status?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#8A94A6]/10">
                  <span className="text-xs text-[#8A94A6]">{order.shippingName}</span>
                  <span className="text-[#D4A03C] font-bold">${Number(order.total).toFixed(2)}</span>
                </div>
              </Link>
              {/* Cancel Button */}
              {canCancel(order.status) && (
                <button
                  onClick={() => handleCancel(order.orderNumber, order.shippingEmail)}
                  disabled={cancelOrder.isPending}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-[#E53935] border border-[#E53935]/30 hover:bg-[#E53935]/10 transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
