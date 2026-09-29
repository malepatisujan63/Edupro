import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/home';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] flex items-center justify-center p-6 select-none">
          <div className="relative w-full max-w-lg rounded-[32px] p-8 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--x-text)] tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-[var(--x-subtext)] leading-relaxed">
                An unexpected interface error occurred. We have isolated the problem so your account data remains secure.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-[11px] font-mono text-rose-400 text-left overflow-x-auto max-h-28">
                {this.state.error.message || 'Component execution failure'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95 btn-keep-white"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => {
                  window.location.hash = '#/home';
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)] border border-[var(--x-border)] text-[var(--x-text)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
