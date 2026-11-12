import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from '../design-system/templates/AdminLayout';
import { resources } from '../features/resource-list';
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ResourcePage = lazy(() => import('../pages/ResourcePage'));
const ProductReportsPage = lazy(() => import('../pages/ProductReportsPage'));
const ProductTemplatesPage = lazy(() => import('../pages/ProductTemplatesPage'));
const DeliveriesPage = lazy(() => import('../pages/DeliveriesPage'));
const SettlementsPage = lazy(() => import('../pages/SettlementsPage'));
const BusinessApplicationsPage = lazy(() => import('../pages/BusinessApplicationsPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const listingsMode = import.meta.env.VITE_MARKETPLACE_MODE !== 'Commerce';
const listingHiddenResources = new Set(['ServiceRequest', 'QualityAssessment', 'AgriculturalOrder', 'Product', 'Auction', 'AuctionBid', 'Discount', 'Warehouse', 'WarehouseInventory', 'Order']);
export default function App() {
  const auth = useAuth();
  if (auth.loading) return <div className="loading full" role="status">در حال بررسی دسترسی…</div>;
  return <Suspense fallback={<div className="loading" role="status">در حال آماده‌سازی صفحه…</div>}><Routes><Route path="/login" element={<LoginPage />} /><Route element={auth.user ? <AdminLayout /> : <Navigate to="/login" replace />}><Route index element={<DashboardPage />} />{resources.filter(resource => !listingsMode || !listingHiddenResources.has(resource.id)).map(resource => <Route key={resource.id} path={'manage/' + resource.id} element={<ResourcePage key={resource.id} resource={resource} />} />)}<Route path="business-applications" element={<BusinessApplicationsPage />} /><Route path="product-reports" element={<ProductReportsPage />} /><Route path="product-types" element={<ProductTemplatesPage />} /><Route path="deliveries" element={listingsMode ? <Navigate to="/" replace /> : <DeliveriesPage />} /><Route path="settlements" element={listingsMode ? <Navigate to="/" replace /> : <SettlementsPage />} /><Route path="checkout" element={listingsMode ? <Navigate to="/" replace /> : <CheckoutPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="*" element={<div className="empty"><h1>صفحه پیدا نشد</h1><a href="#/" className="button secondary">بازگشت به داشبورد</a></div>} /></Route></Routes></Suspense>;
}
