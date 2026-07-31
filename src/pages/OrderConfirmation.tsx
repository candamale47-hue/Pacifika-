import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { CheckCircle, Copy, Check, Mail, Printer, Building2, Hash, Receipt, Truck, Bell, BellOff } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { isPushSupported, subscribeToPush } from "@/lib/push-notifications";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const email = searchParams.get("email") ?? "";
  const [paymentRef, setPaymentRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const { data: order, refetch } = trpc.order.getByNumber.useQuery(
    { orderNumber, email },
    { enabled: !!orderNumber && !!email }
  );

  // Track purchase in funnel
  useEffect(() => {
    if (order) {
      import("@/lib/funnel-tracker").then(({ trackPurchase }) => {
        trackPurchase(order.id, Number(order.total));
      });
    }
  }, [order?.id]);

  const addPaymentRef = trpc.order.addPaymentReference.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      refetch();
    },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitRef = () => {
    if (!paymentRef.trim() || !order) return;
    addPaymentRef.mutate({ id: order.id, paymentReference: paymentRef.trim() });
  };

  const handleEmailReceipt = () => {
    const subject = encodeURIComponent(`Order Receipt - ${orderNumber} - Pacifika Wear`);
    const body = encodeURIComponent(buildReceiptText());
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handlePrintReceipt = () => {
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;
    receiptWindow.document.write(receiptHtml());
    receiptWindow.document.close();
  };

  const buildReceiptText = () => {
    if (!order) return "";
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-AU") : "";
    const itemsList = order.items?.map(i => `- ${i.productName} (${i.size || "N/A"}) x${i.quantity} @ $${Number(i.unitPrice).toFixed(2)} = $${Number(i.totalPrice).toFixed(2)}`).join("\n") ?? "";
    const orderGst = (order as Record<string, unknown>).gstAmount as number | undefined;
    const gstLine = orderGst ? `\nGST (10%): $${Number(orderGst).toFixed(2)}` : "";
    return `PACIFIKA WEAR - TAX INVOICE\nJoel Andamale T/A Pacifika Wear\nABN: 17 121 686 746\n\nOrder Number: ${orderNumber}\nDate: ${date}\n\n--- ITEMS ---\n${itemsList}\n\nSubtotal (incl. GST): $${Number(order.subtotal).toFixed(2)}${gstLine}\nShipping: ${Number(order.shippingCost) === 0 ? "FREE" : "$" + Number(order.shippingCost).toFixed(2)}\nTOTAL (AUD): $${Number(order.total).toFixed(2)}\n\n--- BANK TRANSFER DETAILS ---\nReference: ${orderNumber}\nAmount: $${Number(order.total).toFixed(2)}\n\n--- SHIP TO ---\n${order.shippingName}\n${order.shippingAddress1}${order.shippingAddress2 ? "\n" + order.shippingAddress2 : ""}\n${order.shippingCity}, ${order.shippingState} ${order.shippingPostcode}\n${order.shippingEmail}\n\nQuestions? Contact us at joelandamale@gmail.com or 0460786986`;
  };

  const receiptHtml = () => {
    if (!order) return "";
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
    const itemsRows = order.items?.map(i => `<div class="row"><span>${i.productName} (${i.size || "N/A"}) x${i.quantity}</span><span>$${Number(i.totalPrice).toFixed(2)}</span></div>`).join("") ?? "";
    const orderGst = (order as Record<string, unknown>).gstAmount as number | undefined;
    const gstRow = orderGst ? `<div class="row"><span>GST (10%)</span><span>$${Number(orderGst).toFixed(2)}</span></div>` : "";
    const gstRowStyle = orderGst ? "" : "";
    return `<html><head><title>Tax Invoice ${orderNumber}</title><style>body{font-family:Arial,sans-serif;max-width:500px;margin:40px auto;padding:20px;color:#333}.header{text-align:center;border-bottom:2px solid #D4A03C;padding-bottom:20px;margin-bottom:20px}.brand{font-size:24px;font-weight:bold;color:#1B2A4A}.subtitle{color:#D4A03C;font-size:14px}.abn{color:#888;font-size:11px;margin-top:4px}.section{margin-bottom:20px}.label{color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px}.value{font-size:14px;margin-top:4px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.total{font-size:18px;font-weight:bold;color:#D4A03C;border-top:2px solid #D4A03C;padding-top:10px;margin-top:10px}.bank{background:#f9f9f9;padding:15px;border-radius:8px;margin:10px 0}.footer{text-align:center;color:#888;font-size:12px;margin-top:30px;padding-top:20px;border-top:1px solid #eee}@media print{.no-print{display:none}}</style></head><body><div class="header"><div class="brand">PACIFIKA WEAR</div><div class="subtitle">Tax Invoice</div><div class="abn">Joel Andamale T/A Pacifika Wear | ABN: 17 121 686 746</div></div><div class="section"><div class="label">Order Number</div><div class="value" style="font-size:20px;font-weight:bold;color:#D4A03C">${orderNumber}</div><div class="label" style="margin-top:8px">Date</div><div class="value">${date}</div></div><div class="section"><div class="label">Items (prices incl. GST)</div>${itemsRows}<div class="row"><span>Subtotal (incl. GST)</span><span>$${Number(order.subtotal).toFixed(2)}</span></div>${gstRow}<div class="row"><span>Shipping</span><span>${Number(order.shippingCost) === 0 ? "FREE" : "$" + Number(order.shippingCost).toFixed(2)}</span></div><div class="row total"><span>TOTAL (AUD)</span><span>$${Number(order.total).toFixed(2)}</span></div></div><div class="section bank"><div class="label">Bank Transfer Details</div><div class="value" style="margin-top:4px"><strong>Joel Andamale T/A Pacifika Wear</strong><br>Commonwealth Bank<br>BSB: 064-836 | Account: 10465795</div><div class="label" style="margin-top:8px">Reference</div><div class="value"><strong style="font-family:monospace;color:#D4A03C">${orderNumber}</strong></div><div class="label" style="margin-top:8px">Amount</div><div class="value"><strong style="color:#D4A03C">$${Number(order.total).toFixed(2)}</strong></div>${order.paymentReference ? `<div class="label" style="margin-top:8px">Payment Reference</div><div class="value">${order.paymentReference}</div>` : ""}</div><div class="footer"><strong>Ship To:</strong><br>${order.shippingName}<br>${order.shippingAddress1}${order.shippingAddress2 ? "<br>" + order.shippingAddress2 : ""}<br>${order.shippingCity}, ${order.shippingState} ${order.shippingPostcode}<br>${order.shippingEmail}<br><br>Thank you for shopping with Pacifika Wear!<br>joelandamale@gmail.com | 0460786986</div></body></html>`;
  };

  if (!orderNumber || !email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-[#8A94A6]">No order information found.</p>
        <button onClick={() => navigate("/shop")} className="mt-4 bg-[#D4A03C] text-[#1B2A4A] px-6 py-3 rounded-lg font-semibold text-sm">
          Back to Shop
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A03C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPaid = order.status !== "pending_payment";

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-3">
        <img src="/logo.png" alt="Pacifika Wear" className="h-8 w-auto" />
      </header>

      <div className="px-4 space-y-4">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">Order Placed Successfully!</p>
            <p className="text-xs text-[#8A94A6]">Order #{orderNumber}</p>
          </div>
        </div>

        {/* Push Notification Prompt */}
        {!pushEnabled && isPushSupported() && (
          <div className="bg-[#5BA4CF]/10 border border-[#5BA4CF]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bell size={20} className="text-[#5BA4CF] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Get Order Updates</p>
                <p className="text-xs text-[#8A94A6] mt-0.5">Receive notifications when your order status changes.</p>
                <button
                  onClick={async () => {
                    setPushLoading(true);
                    const success = await subscribeToPush(order?.shippingEmail ?? undefined);
                    setPushEnabled(success);
                    setPushLoading(false);
                  }}
                  disabled={pushLoading}
                  className="mt-2 bg-[#5BA4CF] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {pushLoading ? "Enabling..." : "Enable Notifications"}
                </button>
              </div>
              <button onClick={() => setPushEnabled(true)} className="p-1 text-[#8A94A6]">
                <BellOff size={14} />
              </button>
            </div>
          </div>
        )}

        {pushEnabled && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2 text-green-400 text-sm">
            <Bell size={14} /> You'll receive notifications for order updates!
          </div>
        )}

        {/* Payment Reference Entry */}
        {!isPaid && !submitted && (
          <div className="bg-[#243656] rounded-xl p-4 border border-[#D4A03C]/20">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={16} className="text-[#D4A03C]" />
              <h3 className="text-sm font-semibold">Payment Reference</h3>
            </div>
            <p className="text-xs text-[#8A94A6] mb-3">
              After making the bank transfer, enter your payment reference number here so we can confirm your payment.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. REF123456 or your name"
                className="flex-1 bg-[#1B2A4A] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
              />
              <button
                onClick={handleSubmitRef}
                disabled={!paymentRef.trim() || addPaymentRef.isPending}
                className="bg-[#D4A03C] text-[#1B2A4A] px-5 rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {addPaymentRef.isPending ? "..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-2 text-green-400 text-sm">
            <Check size={16} /> Payment reference submitted! We'll confirm your payment shortly.
          </div>
        )}

        {isPaid && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-2 text-blue-400 text-sm">
            <Check size={16} /> Payment confirmed. Your order is being processed.
          </div>
        )}

        {/* Bank Transfer Details */}
        <div className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-[#D4A03C]" />
            <h3 className="text-sm font-semibold">Bank Transfer Details</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: "Pay To", value: "Joel Andamale T/A Pacifika Wear" },
              { label: "Bank", value: "Commonwealth Bank" },
              { label: "BSB", value: "064-836" },
              { label: "Account", value: "10465795" },
              { label: "Reference", value: orderNumber },
              { label: "Amount", value: `$${Number(order.total).toFixed(2)}` },
            ].map((field) => (
              <div key={field.label} className="flex items-center justify-between py-1 border-b border-[#8A94A6]/10 last:border-0">
                <span className="text-[#8A94A6] text-xs">{field.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${field.label === "Reference" || field.label === "Amount" ? "font-bold text-[#D4A03C]" : ""}`}>
                    {field.value}
                  </span>
                  <button onClick={() => handleCopy(field.value, field.label)} className="p-1">
                    {copiedField === field.label ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-[#8A94A6]" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#243656] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-3">
                {item.productImage && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1B2A4A] flex-shrink-0">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-[10px] text-[#8A94A6]">Qty: {item.quantity} {item.size && `/ Size: ${item.size}`}</p>
                </div>
                <p className="text-xs font-bold text-[#D4A03C]">${Number(item.totalPrice).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t border-[#8A94A6]/20 pt-2 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-[#8A94A6]">Subtotal (incl. GST)</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#8A94A6]">Shipping</span><span className={Number(order.shippingCost) === 0 ? "text-green-400" : ""}>{Number(order.shippingCost) === 0 ? "FREE" : `$${Number(order.shippingCost).toFixed(2)}`}</span></div>
              {(order as Record<string, unknown>).gstAmount ? (
                <div className="flex justify-between text-xs"><span className="text-[#8A94A6]">GST (10%)</span><span className="text-[#D4A03C]/80">${Number((order as Record<string, unknown>).gstAmount as number).toFixed(2)}</span></div>
              ) : null}
              <div className="flex justify-between text-sm font-bold border-t border-[#8A94A6]/20 pt-2"><span>Total (AUD)</span><span className="text-[#D4A03C]">${Number(order.total).toFixed(2)}</span></div>
              <p className="text-[9px] text-[#8A94A6]/50 pt-1">Joel Andamale T/A Pacifika Wear | ABN: 17 121 686 746</p>
            </div>
          </div>
        </div>

        {/* Receipt Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => handleCopy(buildReceiptText(), "receipt")} className="bg-[#243656] rounded-lg py-3 flex flex-col items-center gap-1 text-xs">
            {copiedField === "receipt" ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-[#8A94A6]" />}
            <span className="text-[#8A94A6]">{copiedField === "receipt" ? "Copied!" : "Copy"}</span>
          </button>
          <button onClick={handleEmailReceipt} className="bg-[#243656] rounded-lg py-3 flex flex-col items-center gap-1 text-xs">
            <Mail size={16} className="text-[#5BA4CF]" />
            <span className="text-[#8A94A6]">Email</span>
          </button>
          <button onClick={handlePrintReceipt} className="bg-[#243656] rounded-lg py-3 flex flex-col items-center gap-1 text-xs">
            <Printer size={16} className="text-[#D4A03C]" />
            <span className="text-[#8A94A6]">Print</span>
          </button>
        </div>

        {/* View Full Receipt Toggle */}
        <button onClick={() => setShowReceipt(!showReceipt)} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#8A94A6]">
          <Receipt size={14} /> {showReceipt ? "Hide Receipt" : "View Full Receipt"}
        </button>

        {showReceipt && (
          <div className="bg-white text-[#1B2A4A] rounded-xl p-5 text-sm space-y-3">
            <div className="text-center border-b-2 border-[#D4A03C] pb-3">
              <p className="text-xl font-bold text-[#1B2A4A]">PACIFIKA WEAR</p>
              <p className="text-xs text-[#D4A03C]">Tax Invoice</p>
              <p className="text-[10px] text-gray-400 mt-1">Joel Andamale T/A Pacifika Wear | ABN: 17 121 686 746</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Order Number</p>
              <p className="text-lg font-bold text-[#D4A03C] font-mono">{orderNumber}</p>
            </div>
            <div className="space-y-1">
              {order.items?.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-gray-100 text-xs">
                  <span>{i.productName} ({i.size || "N/A"}) x{i.quantity}</span>
                  <span className="font-medium">${Number(i.totalPrice).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-xs"><span className="text-gray-500">Subtotal (incl. GST)</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
              {(order as Record<string, unknown>).gstAmount ? (
                <div className="flex justify-between py-1 text-xs"><span className="text-gray-500">GST (10%)</span><span>${Number((order as Record<string, unknown>).gstAmount as number).toFixed(2)}</span></div>
              ) : null}
              <div className="flex justify-between py-1 text-xs"><span className="text-gray-500">Shipping</span><span>{Number(order.shippingCost) === 0 ? "FREE" : `$${Number(order.shippingCost).toFixed(2)}`}</span></div>
              <div className="flex justify-between py-2 border-t-2 border-[#D4A03C] font-bold text-sm"><span>TOTAL (AUD)</span><span className="text-[#D4A03C]">${Number(order.total).toFixed(2)}</span></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              <p className="text-[10px] text-gray-500 uppercase">Bank Transfer To</p>
              <p className="font-medium">Joel Andamale T/A Pacifika Wear</p>
              <p className="text-gray-600">Commonwealth Bank</p>
              <p className="font-mono">BSB: 064-836 | Acct: 10465795</p>
              <p className="mt-1"><span className="text-gray-500">Reference:</span> <strong className="font-mono text-[#D4A03C]">{orderNumber}</strong></p>
              {order.paymentReference && <p><span className="text-gray-500">Payment Ref:</span> <strong>{order.paymentReference}</strong></p>}
            </div>
            <p className="text-center text-[10px] text-gray-400 pt-2 border-t">Thank you!<br />joelandamale@gmail.com | 0460786986</p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <button onClick={() => navigate(`/track?order=${orderNumber}&email=${email}`)} className="w-full bg-[#5BA4CF] text-white py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
            <Truck size={16} /> Track My Order
          </button>
          <button onClick={() => navigate("/shop")} className="w-full border border-[#8A94A6]/30 py-3.5 rounded-lg text-sm text-[#8A94A6]">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
