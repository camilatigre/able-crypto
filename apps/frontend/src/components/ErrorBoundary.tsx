import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6 font-sans">
              The application encountered an unexpected error. Please reload the page to continue.
            </p>
            {this.state.error && (
              <details className="text-left text-sm text-muted-foreground mb-6 bg-muted p-4 rounded">
                <summary className="cursor-pointer font-medium mb-2">Error details</summary>
                <code className="block whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-sans font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

