import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { ProductGridSkeleton } from './components/EnhancedSkeleton';
import './i18n';

import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load heavy pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Market = lazy(() => import('./pages/Market'));
const Weather = lazy(() => import('./pages/Weather'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Premium = lazy(() => import('./pages/Premium'));
const Profile = lazy(() => import('./pages/Profile'));

// Free Tools
const CropYieldCalculator = lazy(() => import('./pages/CropYieldCalculator'));
const PestAndDiseaseGuide = lazy(() => import('./pages/PestAndDiseaseGuide'));
const SoilHealthTips = lazy(() => import('./pages/SoilHealthTips'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      suspense: false,
    },
  },
});

const PageSuspense = ({ children }) => (
  <Suspense fallback={<ProductGridSkeleton count={6} />}>
    {children}
  </Suspense>
);

const ToastContext = React.createContext(null);

export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = React.useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = React.useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const info = React.useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
  const warning = React.useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);

  const value = React.useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }), [toasts, addToast, removeToast, success, error, info, warning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

function PrivateRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                
                {/* Lazy loaded routes with Suspense */}
                <Route path="products" element={
                  <PageSuspense>
                    <Products />
                  </PageSuspense>
                } />
                
                <Route path="products/:id" element={
                  <PageSuspense>
                    <ProductDetail />
                  </PageSuspense>
                } />
                
                <Route path="market" element={
                  <PageSuspense>
                    <Market />
                  </PageSuspense>
                } />
                
                <Route path="weather" element={
                  <PageSuspense>
                    <Weather />
                  </PageSuspense>
                } />
                
                {/* Free Tools Routes */}
                <Route path="tools/yield-calculator" element={
                  <PageSuspense>
                    <CropYieldCalculator />
                  </PageSuspense>
                } />
                <Route path="tools/pest-guide" element={
                  <PageSuspense>
                    <PestAndDiseaseGuide />
                  </PageSuspense>
                } />
                <Route path="tools/soil-health" element={
                  <PageSuspense>
                    <SoilHealthTips />
                  </PageSuspense>
                } />

                {/* Protected routes */}
                <Route path="dashboard" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <Dashboard />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                
                <Route path="add-product" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <AddProduct />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                
                <Route path="transactions" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <Transactions />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                
                <Route path="ai-insights" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <AIInsights />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                
                <Route path="premium" element={
                  <PageSuspense>
                    <Premium />
                  </PageSuspense>
                } />
                
                <Route path="profile" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <Profile />
                    </PageSuspense>
                  </PrivateRoute>
                } />
              </Route>
            </Routes>
          </Router>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
