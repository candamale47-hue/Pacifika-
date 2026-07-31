import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { TRPCProvider } from './providers/trpc'
import { WishlistProvider } from './lib/wishlist-context'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
)
