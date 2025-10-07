import React from 'react';
import logger from '../utils/logger';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('Error caught by ErrorBoundary:', error);
    logger.error('Error info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // TODO: Send error to error reporting service
    // Example: Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚠️</span>
            </div>

            <h1 style={styles.title}>Oops! Something went wrong</h1>
            
            <p style={styles.message}>
              We're sorry for the inconvenience. An unexpected error occurred.
              Please try one of the following options:
            </p>

            <div style={styles.buttonGroup}>
              <button 
                onClick={this.handleReset}
                style={styles.buttonPrimary}
              >
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload}
                style={styles.buttonSecondary}
              >
                Reload Page
              </button>
            </div>

            {/* Show error details only in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>
                  Technical Details (Development Only)
                </summary>
                
                <div style={styles.errorDetails}>
                  <div style={styles.errorSection}>
                    <strong>Error:</strong>
                    <pre style={styles.errorText}>
                      {this.state.error.toString()}
                    </pre>
                  </div>

                  {this.state.errorInfo && (
                    <div style={styles.errorSection}>
                      <strong>Component Stack:</strong>
                      <pre style={styles.errorText}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {this.state.error.stack && (
                    <div style={styles.errorSection}>
                      <strong>Stack Trace:</strong>
                      <pre style={styles.errorText}>
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {this.state.errorCount > 1 && (
              <p style={styles.errorCountWarning}>
                ⚠️ Error occurred {this.state.errorCount} times. 
                You may need to clear your browser cache or contact support.
              </p>
            )}

            <div style={styles.footer}>
              <p style={styles.footerText}>
                If the problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Inline styles for the error boundary
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '64px',
  },
  title: {
    color: '#333',
    fontSize: '28px',
    marginBottom: '16px',
    fontWeight: '600',
  },
  message: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  buttonPrimary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    minWidth: '140px',
  },
  buttonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: 'white',
    color: '#007bff',
    border: '2px solid #007bff',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '140px',
  },
  details: {
    marginTop: '32px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '12px',
    userSelect: 'none',
  },
  errorDetails: {
    marginTop: '16px',
  },
  errorSection: {
    marginBottom: '16px',
  },
  errorText: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    color: '#d63384',
    border: '1px solid #dee2e6',
    maxHeight: '200px',
  },
  errorCountWarning: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '6px',
    fontSize: '14px',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e9ecef',
  },
  footerText: {
    color: '#868e96',
    fontSize: '14px',
    margin: 0,
  },
};

export default ErrorBoundary;

