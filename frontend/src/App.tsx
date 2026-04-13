import GlobalErrorBoundary from './core/error-handling/GlobalErrorBoundary';
import AppRoutes from './routes';

export default function App() {
  return (
    <GlobalErrorBoundary>
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--color-bg)' }}>
        <AppRoutes />
      </div>
    </GlobalErrorBoundary>
  );
}
