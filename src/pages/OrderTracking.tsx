import { useSearchParams, Link } from "react-router";
import { ArrowLeft, Check, Package, Truck, Home, ClipboardCheck, Building2, Hash, CreditCard, User, Copy, CheckCircle, ExternalLink, XCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";

const statusSteps = [
  { key: "received", label: "Received", icon: ClipboardCheck },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const email = searchParams.get("email") ?? "";
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: order, isLoading } = trpc.order.getByNumber.useQuery(
    { orderNumber, email },
    { enabled: !!orderNumber && !!email }
  );

  const { data: bankSettings } = trpc.settings.getGroup.useQuery({ group: "payment" });

  const bank = {
    accountName: bankSettings?.find((s) => s.key === "bank_account_name")?.value ?? "Joel Andamale T/A Pacifika Wear",
    bankName: bankSettings?.find((s) => s.key === "bank_name")?.value ?? "Commonwealth Bank",
    bsb: bankSettings?.find((s) => s.key === "bank_bsb")?.value ?? "064836",
    accountNumber: bankSettings?.find((s) => s.key === "bank_account_number")?.value ?? "10465795",
  };

  const utils = trpc.useUtils();
  const cancelOrder = trpc.order.cancel.useMutation({
    onSuccess: () => {
      utils.order.getByNumber.invalidate();
    },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const canCancel = (status: string | null | undefined) => {
    return status === "pending_payment" || status === "received";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A03C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Package size={48} className="text-[#8A94A6]/40 mb-4" />
        <p className="text-[#8A94A6] mb-4">Order not found</p>
        <Link to="/orders" className="text-[#D4A03C] text-sm">Back to Orders</Link>
      </div>
    );
  }

  const isPendingPayment = order.status === "pending_payment";
  const currentStepIndex = statusSteps.findIndex((s) => s.key === (isPendingPayment ? "received" : order.status));
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link to="/orders" className="p-1">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>Track Order</h1>
          <p className="text-xs text-[#8A94A6] font-mono">{order.orderNumber}</p>
        </div>
      </header>

      {/* Status Timeline */}
      <div className="px-4 mt-6">
        <div className="bg-[#243656] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-5">Order Status</h2>
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i <= activeIndex;
              const isCurrent = i === activeIndex;

              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? isCurrent
                          ? "bg-[#D4A03C] text-[#1B2A4A]"
                          : "bg-green-500/20 text-green-400"
                        : "bg-[#1B2A4A] text-[#8A94A6]"
                    }`}>
                      {isCompleted && !isCurrent ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`w-0.5 h-10 ${i < activeIndex ? "bg-green-500/40" : "bg-[#1B2A4A]"}`} />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className={`text-sm font-medium ${isCurrent ? "text-[#D4A03C]" : isCompleted ? "text-green-400" : "text-[#8A94A6]"}`}>
                      {step.label}
                    </p>
                    {isCurrent && order.statusHistory?.[order.statusHistory.length - 1]?.createdAt && (
                      <p className="text-xs text-[#8A94A6] mt-0.5">
                        {new Date(order.statusHistory[order.statusHistory.length - 1].createdAt!).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tracking Number */}
      {order.trackingNumber && (
        <div className="px-4 mt-4">
          <div className="bg-[#5BA4CF]/10 border border-[#5BA4CF]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={16} className="text-[#5BA4CF]" />
              <p className="text-sm font-semibold text-[#5BA4CF]">Package Shipped</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider">Tracking Number</p>
                <p className="text-sm font-mono font-bold">{order.trackingNumber}</p>
              </div>
              <a
                href={`https://auspost.com.au/mypost/track/#/details/${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#5BA4CF] text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                Track <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Banner */}
      {isPendingPayment && (
        <div className="px-4 mt-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Building2 size={14} className="text-yellow-400" />
              </div>
              <p className="text-sm font-semibold text-yellow-400">Payment Pending</p>
            </div>
            <p className="text-xs text-yellow-400/70 leading-relaxed">
              We are awaiting your bank transfer. Please use order number <strong className="font-mono">{order.orderNumber}</strong> as the payment reference. Once received, your order will be processed.
            </p>
          </div>
        </div>
      )}

      {/* Bank Transfer Details - Show if pending payment */}
      {isPendingPayment && (
        <div className="px-4 mt-4">
          <div className="bg-[#243656] rounded-xl border border-[#D4A03C]/20 overflow-hidden">
            <div className="bg-[#D4A03C]/10 px-4 py-2.5 flex items-center gap-2">
              <Building2 size={14} className="text-[#D4A03C]" />
              <span className="text-xs font-semibold text-[#D4A03C] uppercase tracking-wider">Bank Transfer Details</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[#8A94A6]" />
                  <div>
                    <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider">Account Name</p>
                    <p className="text-sm font-medium">{bank.accountName}</p>
                  </div>
                </div>
                <button onClick={() => handleCopy(bank.accountName, "name")} className="p-1.5 text-[#8A94A6] hover:text-[#D4A03C]">
                  {copiedField === "name" ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-[#8A94A6]" />
                <div>
                  <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider">Bank</p>
                  <p className="text-sm font-medium">{bank.bankName}</p>
                </div>
              </div>
              <div className="h-px bg-[#8A94A6]/10" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-[#8A94A6]" />
                  <div>
                    <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider">BSB</p>
                    <p className="text-lg font-mono font-bold text-[#D4A03C]">{bank.bsb}</p>
                  </div>
                </div>
                <button onClick={() => handleCopy(bank.bsb, "bsb")} className="p-1.5 text-[#8A94A6] hover:text-[#D4A03C]">
                  {copiedField === "bsb" ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#8A94A6]" />
                  <div>
                    <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider">Account Number</p>
                    <p className="text-lg font-mono font-bold text-[#D4A03C]">{bank.accountNumber}</p>
                  </div>
                </div>
                <button onClick={() => handleCopy(bank.accountNumber, "acc")} className="p-1.5 text-[#8A94A6] hover:text-[#D4A03C]">
                  {copiedField === "acc" ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="h-px bg-[#8A94A6]/10" />
              <div className="flex justify-between">
                <span className="text-[#8A94A6] text-sm">Amount</span>
                <span className="font-bold text-[#D4A03C]">${Number(order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A94A6] text-sm">Reference</span>
                <span className="font-mono font-bold text-[#D4A03C]">{order.orderNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation */}
      {!isPendingPayment && order.paymentReference && (
        <div className="px-4 mt-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">Payment Received</p>
              <p className="text-xs text-green-400/70">Ref: {order.paymentReference}</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Notes */}
      {(() => {
        const notes = (order as Record<string, unknown>).customerNotes as string | undefined;
        return notes ? (
          <div className="px-4 mt-4">
            <div className="bg-[#243656] rounded-xl p-4 border border-[#D4A03C]/10">
              <p className="text-[10px] text-[#8A94A6] uppercase tracking-wider mb-1">Your Notes</p>
              <p className="text-sm text-[#F0EDE6]/80">{notes}</p>
            </div>
          </div>
        ) : null;
      })()}

      {/* Order Items */}
      <div className="px-4 mt-4">
        <div className="bg-[#243656] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-3">
                {item.productImage && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-[#8A94A6]">Qty: {item.quantity}</p>
                  <p className="text-[#D4A03C] text-sm font-bold">${Number(item.totalPrice).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="px-4 mt-4">
        <div className="bg-[#243656] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Shipping Address</h2>
          <p className="text-sm">{order.shippingName}</p>
          <p className="text-sm text-[#8A94A6]">{order.shippingAddress1}</p>
          {order.shippingAddress2 && <p className="text-sm text-[#8A94A6]">{order.shippingAddress2}</p>}
          <p className="text-sm text-[#8A94A6]">
            {order.shippingCity}, {order.shippingState} {order.shippingPostcode}
          </p>
          <p className="text-sm text-[#8A94A6]">{order.shippingCountry}</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="px-4 mt-4">
        <div className="bg-[#243656] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8A94A6]">Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#8A94A6]">Discount</span>
              <span className="text-green-400">-${Number(order.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[#8A94A6]">Shipping</span>
            <span className={Number(order.shippingCost) === 0 ? "text-green-400" : ""}>
              {Number(order.shippingCost) === 0 ? "FREE" : `$${Number(order.shippingCost).toFixed(2)}`}
            </span>
          </div>
          <div className="border-t border-[#8A94A6]/20 pt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-[#D4A03C] font-bold">${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cancel Order */}
      {canCancel(order.status) && (
        <div className="px-4 mt-4">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel this order?")) {
                cancelOrder.mutate({ orderNumber, email });
              }
            }}
            disabled={cancelOrder.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-[#E53935] border border-[#E53935]/30 hover:bg-[#E53935]/10 transition-colors disabled:opacity-50"
          >
            <XCircle size={16} />
            {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}

      {/* Contact Support */}
      <div className="px-4 mt-4 mb-6 text-center">
        <Link to="/contact" className="text-[#5BA4CF] text-sm">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
