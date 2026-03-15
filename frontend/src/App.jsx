import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TriageDashboard from './pages/TriageDashboard';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import BrandsPage from './pages/BrandsPage';
import ItemsPage from './pages/ItemsPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import TransactionsPage from './pages/TransactionsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import BrandContentPage from './pages/BrandContentPage';
import { isAuthenticated } from './utils/auth';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface-50 font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Triage Dashboard (post-login home) */}
          <Route path="/dashboard" element={<ProtectedRoute><TriageDashboard /></ProtectedRoute>} />

          {/* Marketing Projects */}
          <Route path="/projects" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />

          {/* Brands */}
          <Route path="/brands" element={<ProtectedRoute><BrandsPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
          <Route path="/brands/:brandId/content" element={<ProtectedRoute><BrandContentPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
