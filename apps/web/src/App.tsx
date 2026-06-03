import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

// --- PUBLIC PAGES ---
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicDirectory from './pages/PublicDirectory';
import PublicCompanyProfile from './pages/PublicCompanyProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// --- OWNER / COMPANY ADMIN PAGES (/dashboard/*) ---
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Workforce from './pages/WorkForce';
import BusinessSettings from './pages/BusinessSettings';
import UserProfile from './pages/UserProfile';
import InvoiceEditor from './pages/InvoiceEditor';
import DirectoryLeads from './pages/DirectoryLeads';
import MarketplaceManager from './pages/MarketplaceManager';
import Invoices from './pages/Invoices';
import Receipts from './pages/Receipts';
import CreateReceipt from './pages/CreateReceipt';
import ReceiptDetail from './pages/ReceiptDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import Services from './pages/Services';
import Wallet from './pages/Wallet';

// --- STAFF / ENGINEER PAGES (/staff/*) ---
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffProjects from './pages/staff/StaffProjects';
import StaffAI from './pages/staff/StaffAI';
import StaffDocuments from './pages/staff/StaffDocuments';
import StaffSettings from './pages/staff/StaffSettings';

// --- SUPER ADMIN PAGES (/admin/*) ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStats from './pages/admin/AdminStats';
import AdminSettings from './pages/admin/AdminSettings';

// --- SHARED DETAIL PAGES ---
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import Analytics from './pages/Analytics';
import TenderBoard from './pages/TenderBoard';
import Opportunities from './pages/Opportunities';
import SubmitBid from './pages/SubmitBid';
import TenderDetail from './pages/TenderDetail';
import BOQEngine from './pages/BOQEngine';
import Documents from './pages/Documents';
import AIAssistant from './pages/AIAssistant';
import CommunityHub from './pages/community/CommunityHub';
import CommunityPostDetail from './pages/community/CommunityPostDetail';
import PublicMarketplace from './pages/PublicMarketPlace';
import MarketplaceProduct from './pages/MarketPlaceProduct';
import PublicPostTender from './pages/PublicPostTender';

// Wrapper: every owner dashboard route goes through OnboardingGate
const OwnerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['owner']}>
    {/* <OnboardingGate> */}
      {children}
    {/* </OnboardingGate> */}
  </ProtectedRoute>
);
function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getHomePath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'staff') return '/staff/dashboard';
    return '/dashboard';
  };

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#001529',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── GUEST ROUTES ── */}
          <Route path="/" element={isAuthenticated ? <Navigate to={getHomePath()} /> : <Landing />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to={getHomePath()} /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to={getHomePath()} /> : <Register />} />
          <Route path="/directory" element={<PublicDirectory />} />
          <Route path="/marketplace" element={<PublicMarketplace />} />
          <Route path="/product/:id" element={<MarketplaceProduct />} />
          <Route path="/company/:id" element={<PublicCompanyProfile />} />
          <Route path="/post-project" element={<PublicPostTender />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── OWNER ROUTES — wrapped in OnboardingGate ── */}
          <Route path="/dashboard" element={<OwnerRoute><Dashboard /></OwnerRoute>} />
          <Route path="/dashboard/finance" element={<OwnerRoute><Finance /></OwnerRoute>} />
          <Route path="/dashboard/workforce" element={<OwnerRoute><Workforce /></OwnerRoute>} />
          <Route path="/dashboard/invoices/new" element={<OwnerRoute><InvoiceEditor /></OwnerRoute>} />
          <Route path="/dashboard/settings/business" element={<OwnerRoute><BusinessSettings /></OwnerRoute>} />
          <Route path="/dashboard/settings/profile" element={<OwnerRoute><UserProfile /></OwnerRoute>} />
          {/* Renamed: /dashboard/directory → /dashboard/inquiries */}
          <Route path="/dashboard/inquiries" element={<OwnerRoute><DirectoryLeads /></OwnerRoute>} />
          {/* Keep old URL alive so nothing 404s */}
          <Route path="/dashboard/directory" element={<Navigate to="/dashboard/inquiries" replace />} />
          <Route path="/dashboard/marketplace" element={<OwnerRoute><MarketplaceManager /></OwnerRoute>} />
          <Route path="/dashboard/invoices" element={<OwnerRoute><Invoices /></OwnerRoute>} />
          <Route path="/dashboard/receipts" element={<OwnerRoute><Receipts /></OwnerRoute>} />
          <Route path="/dashboard/receipts/new" element={
            <OwnerRoute>
              <ErrorBoundary>
                <CreateReceipt />
              </ErrorBoundary>
            </OwnerRoute>
          } />
          <Route path="/dashboard/receipts/:id" element={<OwnerRoute><ReceiptDetail /></OwnerRoute>} />
          <Route path="/dashboard/services" element={<OwnerRoute><Services /></OwnerRoute>} />
          <Route path="/dashboard/wallet" element={<OwnerRoute><Wallet /></OwnerRoute>} />
          <Route path="/dashboard/wallet/verify" element={<OwnerRoute><Wallet /></OwnerRoute>} />
          <Route path="/dashboard/projects/new" element={<OwnerRoute><NewProject /></OwnerRoute>} />
          <Route path="/dashboard/projects" element={<OwnerRoute><Projects /></OwnerRoute>} />
          <Route path="/dashboard/projects/:id" element={<OwnerRoute><ProjectDetail /></OwnerRoute>} />
          <Route path="/dashboard/boq" element={<OwnerRoute><BOQEngine /></OwnerRoute>} />
          <Route path="/dashboard/analytics" element={<OwnerRoute><Analytics /></OwnerRoute>} />
          <Route path="/dashboard/ai" element={<OwnerRoute><AIAssistant /></OwnerRoute>} />
          <Route path="/dashboard/documents" element={<OwnerRoute><Documents /></OwnerRoute>} />
          <Route path="/dashboard/tenders" element={<OwnerRoute><TenderBoard /></OwnerRoute>} />
          <Route path="/dashboard/opportunities" element={<OwnerRoute><Opportunities /></OwnerRoute>} />
          <Route path="/dashboard/tenders/:id/bid" element={<OwnerRoute><SubmitBid /></OwnerRoute>} />
          <Route path="/dashboard/tenders/:id" element={<OwnerRoute><TenderDetail /></OwnerRoute>} />
          <Route path="/dashboard/community" element={<OwnerRoute><CommunityHub /></OwnerRoute>} />
          <Route path="/dashboard/community/:id" element={<OwnerRoute><CommunityPostDetail /></OwnerRoute>} />

          {/* ── STAFF ROUTES ── */}
          <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/projects" element={<ProtectedRoute allowedRoles={['staff']}><StaffProjects /></ProtectedRoute>} />
          <Route path="/staff/ai" element={<ProtectedRoute allowedRoles={['staff']}><StaffAI /></ProtectedRoute>} />
          <Route path="/staff/documents" element={<ProtectedRoute allowedRoles={['staff']}><StaffDocuments /></ProtectedRoute>} />
          <Route path="/staff/settings" element={<ProtectedRoute allowedRoles={['staff']}><StaffSettings /></ProtectedRoute>} />

          {/* ── ADMIN ROUTES ── */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['admin']}><AdminStats /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
