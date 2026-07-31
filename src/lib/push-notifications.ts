/**
 * Push Notification utility
 * Manages browser push subscription for order status updates
 */

const PUBLIC_VAPID_KEY = "BEl62iJSqOOo0E9LghcxEtjYiaPFRk7K--L9b8-MxP_8Z3dG8jVdJ8X2Y3Z7"; // Placeholder - generate real one for production

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  return Notification.requestPermission();
}

export async function subscribeToPush(email?: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    const subJson = subscription.toJSON();
    const keys = subJson.keys as { p256dh: string; auth: string };

    // Send to server
    await fetch("/api/trpc/push.subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          endpoint: subJson.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          email: email ?? undefined,
        },
      }),
    });

    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/trpc/push.unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { endpoint: subscription.endpoint } }),
      });
    }
  } catch {
    // silently fail
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Generate a unique session ID for funnel tracking
export function getSessionId(): string {
  let sid = sessionStorage.getItem("pw_session_id");
  if (!sid) {
    sid = "s_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    sessionStorage.setItem("pw_session_id", sid);
  }
  return sid;
}
