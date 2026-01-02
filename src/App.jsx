import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Consultation from './pages/Consultation';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import BookAppointment from './pages/BookAppointment';
import AdminLogin from './pages/admin/AdminLogin';
import Appointments from './pages/admin/Appointments';
import DashboardOverview from './pages/admin/DashboardOverview';
import DashboardLayout from './pages/admin/DashboardLayout';
import InventoryLayout from './pages/inventory/InventoryLayout';
import StockMovement from './pages/admin/StockMovement';
import InventoryAccounting from './pages/admin/InventoryAccounting';
import InventoryAnalytics from './pages/admin/InventoryAnalytics';
import InventorySettings from './pages/admin/InventorySettings';
import ProductManager from './pages/admin/ProductManager';
import ProductForm from './pages/admin/ProductForm';
import DoctorManager from './pages/admin/DoctorManager';
import DoctorForm from './pages/admin/DoctorForm';
import LeadManager from './pages/admin/LeadManager';
import OfferManager from './pages/admin/OfferManager';
import CategoryManager from './pages/admin/CategoryManager';
import ConcernManager from './pages/admin/ConcernManager';
import BrandManager from './pages/admin/BrandManager';
import BlogManager from './pages/admin/BlogManager';
import BlogForm from './pages/admin/BlogForm';
import PrescriptionManager from './pages/admin/PrescriptionManager';
import PrescriptionReview from './pages/admin/PrescriptionReview';
import UserManager from './pages/admin/UserManager';
import SettingsManager from './pages/admin/SettingsManager';

import Inventory from './pages/admin/Inventory';
import InventoryReports from './pages/admin/InventoryReports';
import OrderManagement from './pages/admin/OrderManagement';
import OrderDetails from './pages/admin/OrderDetails';
import UserPrescriptions from './pages/UserPrescriptions';
import UserProfile from './pages/UserProfile';
import PrescriptionDetails from './pages/PrescriptionDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <CartProvider>
      <ScrollToTop />
      <CartDrawer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/shop" element={<Layout><Shop /></Layout>} />
        <Route path="/product/:id" element={<Layout><ProductDetails /></Layout>} />
        <Route path="/cart" element={<Layout><Cart /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        <Route path="/blog" element={<Layout><Blog /></Layout>} />
        <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
        <Route path="/consultation" element={<Layout><BookAppointment /></Layout>} />
        <Route path="/book-appointment" element={<Layout><BookAppointment /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* Auth Routes */}
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route path="/profile" element={<Layout><UserProfile /></Layout>} />
        <Route path="/complete-profile" element={<Layout><UserProfile /></Layout>} />

        {/* Prescription Routes */}
        <Route path="/prescriptions" element={<Layout><UserPrescriptions /></Layout>} />
        <Route path="/prescriptions/:id" element={<Layout><PrescriptionDetails /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />


        {/* Inventory Portal Routes */}
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <InventoryLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InventoryReports />} />
          <Route path="movement" element={<StockMovement />} />
          <Route path="stock" element={<Inventory />} />
          <Route path="accounting" element={<InventoryAccounting />} />
          <Route path="reports" element={<InventoryAnalytics />} />
          <Route path="settings" element={<InventorySettings />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'seo_writer', 'doctor']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="appointments" element={<Appointments />} />

          import OrderManagement from './pages/admin/OrderManagement';
          import OrderDetails from './pages/admin/OrderDetails';

          // ... (in App component)
          <Route path="prescriptions" element={<PrescriptionManager />} />
          <Route path="prescriptions/:id" element={<PrescriptionReview />} />

          <Route path="orders" element={<OrderManagement />} />
          <Route path="orders/:orderId" element={<OrderDetails />} />

          <Route path="products" element={<ProductManager />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />

          <Route path="doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorManager /></ProtectedRoute>} />
          <Route path="doctors/new" element={<ProtectedRoute allowedRoles={['admin']}><DoctorForm /></ProtectedRoute>} />
          <Route path="doctors/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><DoctorForm /></ProtectedRoute>} />

          <Route path="leads" element={<ProtectedRoute allowedRoles={['admin']}><LeadManager /></ProtectedRoute>} />
          <Route path="offers" element={<ProtectedRoute allowedRoles={['admin']}><OfferManager /></ProtectedRoute>} />
          <Route path="categories" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManager /></ProtectedRoute>} />
          <Route path="concerns" element={<ProtectedRoute allowedRoles={['admin']}><ConcernManager /></ProtectedRoute>} />
          <Route path="brands" element={<ProtectedRoute allowedRoles={['admin']}><BrandManager /></ProtectedRoute>} />



          <Route path="blogs" element={<BlogManager />} />
          <Route path="blogs/new" element={<BlogForm />} />
          <Route path="blogs/edit/:id" element={<BlogForm />} />

          <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UserManager /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsManager /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Layout><div className="p-20 text-center">Page not found</div></Layout>} />
      </Routes>
    </CartProvider>
  );
}

export default App;
