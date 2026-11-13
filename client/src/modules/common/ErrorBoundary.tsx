import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[MODULE ERROR: ${this.props.moduleName || 'App'}]`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl m-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-full mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">
            {this.props.moduleName ? `${this.props.moduleName} Error` : 'Module Encountered an Error'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            {this.state.error?.message || 'An unexpected rendering issue occurred in this section.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
