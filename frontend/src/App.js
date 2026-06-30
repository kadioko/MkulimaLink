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
const CropCalendar = lazy(() => import('./pages/CropCalendar'));

// Livestock Management
const LivestockDashboard = lazy(() => import('./pages/Livestock/LivestockDashboard'));
const AnimalProfile = lazy(() => import('./pages/Livestock/AnimalProfile'));
const LivestockInventory = lazy(() => import('./pages/Livestock/LivestockInventory'));
const ReproductionTracker = lazy(() => import('./pages/Livestock/ReproductionTracker'));
const BreedsLibrary = lazy(() => import('./pages/Livestock/BreedsLibrary'));
const FarmWorkspace = lazy(() => import('./pages/Livestock/FarmWorkspace'));
const LivestockCalendar = lazy(() => import('./pages/Livestock/LivestockCalendar'));

// Analytics
const AnalyticsDashboard = lazy(() => import('./pages/Analytics/AnalyticsDashboard.jsx'));
const MarketIntelligence = lazy(() => import('./pages/Analytics/MarketIntelligence.jsx'));
const PredictiveAnalytics = lazy(() => import('./pages/Analytics/PredictiveAnalytics.jsx'));

// Community
const CommunityHub = lazy(() => import('./pages/Community/CommunityHub.jsx'));
const ExpertNetwork = lazy(() => import('./pages/Community/ExpertNetwork.jsx'));
const TrainingPlatform = lazy(() => import('./pages/Community/TrainingPlatform.jsx'));

// Marketplace extras
const GroupBuying = lazy(() => import('./pages/GroupBuying'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Chats = lazy(() => import('./pages/Chats'));

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

                {/* Farm Tools */}
                <Route path="crop-calendar" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <CropCalendar />
                    </PageSuspense>
                  </PrivateRoute>
                } />

                {/* Analytics */}
                <Route path="analytics" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <AnalyticsDashboard />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="analytics/market" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <MarketIntelligence />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="analytics/predictive" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <PredictiveAnalytics />
                    </PageSuspense>
                  </PrivateRoute>
                } />

                {/* Community */}
                <Route path="community" element={
                  <PageSuspense>
                    <CommunityHub />
                  </PageSuspense>
                } />
                <Route path="community/experts" element={
                  <PageSuspense>
                    <ExpertNetwork />
                  </PageSuspense>
                } />
                <Route path="community/training" element={
                  <PageSuspense>
                    <TrainingPlatform />
                  </PageSuspense>
                } />

                {/* Marketplace extras */}
                <Route path="group-buying" element={
                  <PageSuspense>
                    <GroupBuying />
                  </PageSuspense>
                } />

                {/* Chat */}
                <Route path="chat" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <Chats />
                    </PageSuspense>
                  </PrivateRoute>
                } />

                {/* Redirect-to-nearest pages for nav links without dedicated pages yet */}
                <Route path="notifications" element={<Navigate to="/dashboard" />} />
                <Route path="auctions" element={
                  <PageSuspense>
                    <Products />
                  </PageSuspense>
                } />
                <Route path="suppliers" element={
                  <PageSuspense>
                    <Products />
                  </PageSuspense>
                } />
                <Route path="loans" element={
                  <PageSuspense>
                    <Premium />
                  </PageSuspense>
                } />
                <Route path="insurance" element={
                  <PageSuspense>
                    <Premium />
                  </PageSuspense>
                } />

                {/* Admin */}
                <Route path="admin" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <AdminDashboard />
                    </PageSuspense>
                  </PrivateRoute>
                } />

                {/* Livestock Calendar */}
                <Route path="livestock/calendar" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <LivestockCalendar />
                    </PageSuspense>
                  </PrivateRoute>
                } />

                {/* Livestock Management Routes - static paths must come before :id */}
                <Route path="livestock" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <LivestockDashboard />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="livestock/inventory" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <LivestockInventory />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="livestock/reproduction" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <ReproductionTracker />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="livestock/breeds" element={
                  <PageSuspense>
                    <BreedsLibrary />
                  </PageSuspense>
                } />
                <Route path="livestock/workspace" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <FarmWorkspace />
                    </PageSuspense>
                  </PrivateRoute>
                } />
                <Route path="livestock/:id" element={
                  <PrivateRoute>
                    <PageSuspense>
                      <AnimalProfile />
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
