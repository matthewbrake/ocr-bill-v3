import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationCircleIcon } from './icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-6 py-8 rounded-lg text-center" role="alert">
            <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
            <p className="mb-4">An unexpected error occurred while trying to display the content. This might be due to an unusual data format from the AI model.</p>
            <p className="text-sm text-gray-400 mb-4">
                <strong>Error Details:</strong> {this.state.error?.message || 'Unknown error'}
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors"
            >
                Reload Application
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
