import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour le state pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le débogage
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
          <div className="max-w-md p-6 bg-red-900 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4">🚨 Quelque chose s'est mal passé</h2>
            <p className="mb-4 text-gray-200">
              Une erreur inattendue s'est produite dans le jeu.
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="mb-4 text-left text-sm">
                <summary className="cursor-pointer font-medium">
                  Détails de l'erreur
                </summary>
                <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium"
              >
                Recharger la page
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