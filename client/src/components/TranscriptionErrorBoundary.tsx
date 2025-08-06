// @ts-nocheck
/**
 * Error Boundary for Transcription Components
 * Catches and handles errors in transcription features gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class TranscriptionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state to show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Transcription Error Boundary caught an error:', error, errorInfo);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // This would typically send to a service like Sentry
      console.error('Production transcription error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      // Graceful degradation UI
      return (
        <div className="flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Voice Input Temporarily Unavailable
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {this.props.fallbackMessage || 
                  'The transcription feature encountered an error. You can still type your notes manually.'
                }
              </p>
            </div>
            
            {/* Reset button for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-2">
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <details className="text-xs text-left bg-red-100 p-2 rounded mt-2">
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error?.message}
                    {'\n\n'}
                    {this.state.error?.stack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withTranscriptionErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <TranscriptionErrorBoundary fallbackMessage={fallbackMessage}>
        <WrappedComponent {...props} />
      </TranscriptionErrorBoundary>
    );
  };
}

export default TranscriptionErrorBoundary;