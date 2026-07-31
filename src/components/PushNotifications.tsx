import { useEffect, useState } from "react";
import { X, Package, Truck, CheckCircle, Clock } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "shipping" | "success" | "info";
  orderNumber?: string;
}

// Track which order statuses we've already notified for
const NOTIFIED_KEY = "pacifika_notified_orders";

function getNotifiedSet(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]");
    return new Set(raw as string[]);
  } catch {
    return new Set();
  }
}

function markNotified(orderNumber: string, status: string) {
  const set = getNotifiedSet();
  set.add(`${orderNumber}:${status}`);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set].slice(-50))); // Keep last 50
}

const icons: Record<string, typeof Package> = {
  order: Package,
  shipping: Truck,
  success: CheckCircle,
  info: Clock,
};

const colors: Record<string, string> = {
  order: "text-[#5BA4CF]",
  shipping: "text-[#D4A03C]",
  success: "text-green-400",
  info: "text-[#8A94A6]",
};

const bgColors: Record<string, string> = {
  order: "bg-[#5BA4CF]/10 border-[#5BA4CF]/20",
  shipping: "bg-[#D4A03C]/10 border-[#D4A03C]/20",
  success: "bg-green-500/10 border-green-500/20",
  info: "bg-[#243656] border-[#8A94A6]/10",
};

/**
 * Check order status and show notification if changed
 */
export function checkOrderStatus(orderNumber: string, status: string) {
  const key = `${orderNumber}:${status}`;
  if (getNotifiedSet().has(key)) return;
  markNotified(orderNumber, status);

  const statusLabels: Record<string, { title: string; message: string; type: Notification["type"] }> = {
    received: { title: "Order Received", message: `Order ${orderNumber} has been received.`, type: "order" },
    processing: { title: "Order Processing", message: `Order ${orderNumber} is being prepared.`, type: "info" },
    shipped: { title: "Order Shipped", message: `Order ${orderNumber} is on its way!`, type: "shipping" },
    delivered: { title: "Delivered", message: `Order ${orderNumber} has been delivered.`, type: "success" },
  };

  const info = statusLabels[status];
  if (!info) return;

  showNotification({
    id: key,
    title: info.title,
    message: info.message,
    type: info.type,
    orderNumber,
  });
}

// Simple event bus for notifications
const listeners = new Set<(n: Notification) => void>();

function showNotification(n: Notification) {
  listeners.forEach((l) => l(n));
}

export function PushNotificationContainer() {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    const onNotif = (n: Notification) => {
      setNotifs((prev) => [n, ...prev]);
      // Auto dismiss after 5s
      setTimeout(() => {
        setNotifs((prev) => prev.filter((p) => p.id !== n.id));
      }, 5000);
    };
    listeners.add(onNotif);
    return () => { listeners.delete(onNotif); };
  }, []);

  if (notifs.length === 0) return null;

  return (
    <div className="fixed top-2 left-2 right-2 z-[70] space-y-2 pointer-events-none">
      {notifs.map((n) => {
        const Icon = icons[n.type];
        return (
          <div
            key={n.id}
            className={`pointer-events-auto ${bgColors[n.type]} border rounded-xl p-3.5 flex items-start gap-3 shadow-lg animate-in slide-in-from-top fade-in duration-300`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors[n.type]} bg-opacity-20`}>
              <Icon size={16} className={colors[n.type]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-[#8A94A6]">{n.message}</p>
            </div>
            <button
              onClick={() => setNotifs((prev) => prev.filter((p) => p.id !== n.id))}
              className="p-1 text-[#8A94A6]"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
