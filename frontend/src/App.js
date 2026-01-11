import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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
                  <Suspense fallback={<div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>}>
                    <Products />
                  </Suspense>
                } />
                
                <Route path="products/:id" element={
                  <Suspense fallback={<div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>}>
                    <ProductDetail />
                  </Suspense>
                } />
                
                <Route path="market" element={
                  <Suspense fallback={<div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>}>
                    <Market />
                  </Suspense>
                } />
                
                <Route path="weather" element={
                  <Suspense fallback={<div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>}>
                    <Weather />
                  </Suspense>
                } />
                
                {/* Protected routes */}
                <Route path="dashboard" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <Dashboard />
                    </Suspense>
                  </PrivateRoute>
                } />
                
                <Route path="add-product" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <AddProduct />
                    </Suspense>
                  </PrivateRoute>
                } />
                
                <Route path="transactions" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <Transactions />
                    </Suspense>
                  </PrivateRoute>
                } />
                
                <Route path="ai-insights" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <AIInsights />
                    </Suspense>
                  </PrivateRoute>
                } />
                
                <Route path="premium" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <Premium />
                    </Suspense>
                  </PrivateRoute>
                } />
                
                <Route path="profile" element={
                  <PrivateRoute>
                    <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>}>
                      <Profile />
                    </Suspense>
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
