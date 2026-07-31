import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

function getSessionId() {
  let sid = localStorage.getItem("pw_session_id");
  if (!sid) {
    sid = "pw_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("pw_session_id", sid);
  }
  return sid;
}

interface WishlistContextType {
  likedIds: Set<number>;
  toggle: (productId: number) => void;
  isLiked: (productId: number) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextType>({
  likedIds: new Set(),
  toggle: () => {},
  isLiked: () => false,
  count: 0,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [sessionId] = useState(getSessionId);
  const [ready, setReady] = useState(false);

  const utils = trpc.useUtils();
  const toggleMutation = trpc.wishlist.toggle.useMutation({
    onSuccess: () => utils.wishlist.list.invalidate(),
  });
  const migrateMutation = trpc.wishlist.migrate.useMutation();

  const { data: serverWishlist } = trpc.wishlist.list.useQuery(
    user?.id ? { userId: user.id } : { sessionId }
  );

  // Build liked set from server data
  useEffect(() => {
    if (serverWishlist) {
      const ids = new Set(serverWishlist.filter(w => w.product).map(w => w.productId));
      setLikedIds(ids);
      setReady(true);
    }
  }, [serverWishlist]);

  // Migrate guest wishlist on login
  useEffect(() => {
    if (user?.id && ready) {
      migrateMutation.mutateAsync({ userId: user.id, sessionId }).then(() => {
        utils.wishlist.list.invalidate();
      });
    }
  }, [user?.id]); // eslint-disable-line

  const toggle = useCallback(async (productId: number) => {
    const isAdding = !likedIds.has(productId);
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const result = await toggleMutation.mutateAsync({
        productId,
        userId: user?.id ?? undefined,
        sessionId,
      });
      // If server says different, trust server
      if (result.added !== isAdding) {
        setLikedIds(prev => {
          const next = new Set(prev);
          if (result.added) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
    } catch {
      // Revert on error
      setLikedIds(prev => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }
  }, [likedIds, user, sessionId, toggleMutation]);

  const isLiked = useCallback((productId: number) => likedIds.has(productId), [likedIds]);

  return (
    <WishlistContext.Provider value={{ likedIds, toggle, isLiked, count: likedIds.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
