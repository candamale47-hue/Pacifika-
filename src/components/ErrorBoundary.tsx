import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error.message, errorInfo);
  }

  handleReload = () => { window.location.reload(); };
  handleGoHome = () => { window.location.href = "/shop"; };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-[#0F1923] flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 bg-[#E53935]/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-[#8A94A6] text-sm mb-6 max-w-xs">
              Don't worry — your data is safe. This was a temporary issue.
            </p>
            <div className="flex gap-3">
              <button onClick={this.handleReload} className="bg-[#D4A03C] text-[#1B2A4A] px-6 py-2.5 rounded-lg font-semibold text-sm">Reload Page</button>
              <button onClick={this.handleGoHome} className="bg-[#1B2A4A] text-[#F0EDE6] px-6 py-2.5 rounded-lg font-semibold text-sm border border-[#8A94A6]/20">Go to Shop</button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
