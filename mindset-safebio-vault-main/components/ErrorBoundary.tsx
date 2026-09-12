import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public declare props: Props;
  public state: State = {
    hasError: false,
    error: null,
  };
  public declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-cardSlate border border-rose-500/30 rounded-2xl p-6 my-4 text-kora shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-kora">
                {this.props.fallbackTitle || 'Unable to display this section'}
              </h3>
              <p className="text-xs text-pencil mt-1 leading-relaxed">
                {this.props.fallbackMessage || 'An unexpected rendering error occurred. Your session and feed data remain safe.'}
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 rounded-lg bg-midnight/80 border border-cardBorder text-[11px] font-mono text-pencil overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
              <button
                onClick={this.handleReset}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-kora transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
