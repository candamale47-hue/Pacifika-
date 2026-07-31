import { useEffect, useRef, useState } from "react";
import { CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  amount: number;
  postalCode?: string;
  onPaymentSuccess: (paymentId: string) => void | Promise<void>;
  onPaymentError: (error: string) => void;
}

export default function SquarePaymentForm({ amount, postalCode, onPaymentSuccess, onPaymentError }: Props) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const appId = "sandbox-sq0idb-xwLHxd8lyD9kGaGui9GXvQ";
  const locId = "LA8Y3N6WQHF1F";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!(window as any).Square) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://sandbox.web.squarecdn.com/v1/square.js";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load Square SDK"));
            document.head.appendChild(s);
          });
        }
        if (!mounted) return;
        const payments = (window as any).Square.payments(appId, locId);

        const cardConfig: any = {
          style: {
            ".input-container": { borderColor: "#2A3544", borderRadius: "8px" },
            ".input-container.is-focus": { borderColor: "#D4A03C" },
            ".input-container.is-error": { borderColor: "#EF4444" },
          },
        };
        if (postalCode) cardConfig.postalCode = postalCode;

        const cardInstance = await payments.card(cardConfig);
        if (!mounted) return;
        await cardInstance.attach(cardContainerRef.current!);
        if (mounted) { setCard(cardInstance); setIsLoading(false); }
      } catch (err: any) {
        if (mounted) { setErrors([err.message || "Failed to load payment form"]); setIsLoading(false); }
      }
    };
    load();
    return () => { mounted = false; if (card) card.destroy(); };
  }, [postalCode]);

  const handlePay = async () => {
    // Immediate lock — blocks double-click before React re-renders
    if (!card || lockedRef.current || isProcessing) return;
    lockedRef.current = true;
    setIsProcessing(true);
    setErrors([]);
    try {
      const result = await card.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.[0]?.message || "Tokenization failed");
      }
      // Stay locked until order create + payment finish
      await onPaymentSuccess(result.token);
      // Keep locked on success (navigates away); do not unlock
    } catch (err: any) {
      const message = err.message || "Payment failed";
      setErrors([message]);
      onPaymentError(message);
      lockedRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {errors.map((e, i) => (
        <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{e}
        </div>
      ))}
      <div className="flex items-center gap-2 text-gold mb-2">
        <CreditCard className="w-4 h-4" /><span className="text-sm font-medium">Card Details</span>
      </div>
      <div ref={cardContainerRef} className="min-h-[56px] bg-[#1B2432] border border-[#2A3544] rounded-lg" />
      {isLoading && <div className="flex items-center gap-2 text-[#8B7355] text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" />Loading secure payment form...</div>}
      <button onClick={handlePay} disabled={isProcessing || isLoading || !card}
        className="w-full py-3.5 px-6 bg-[#D4A03C] text-[#0B1120] font-semibold rounded-lg hover:bg-[#E4B04C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <>Pay ${amount.toFixed(2)}</>}
      </button>
      <div className="flex items-center justify-center gap-1.5 text-[#6B7B8F] text-xs"><Lock className="w-3 h-3" />Secured by Square. Card details never touch our servers.</div>
    </div>
  );
}
