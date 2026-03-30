import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import React, { Suspense } from 'react';

// ── Lazy-loaded page components for code splitting ──────────
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'));
const SolutionsPage = React.lazy(() => import('./pages/SolutionsPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const DisclaimerPage = React.lazy(() => import('./pages/DisclaimerPage'));
const RefundPage = React.lazy(() => import('./pages/RefundPage'));
const CareersPage = React.lazy(() => import('./pages/CareersPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const DocsPage = React.lazy(() => import('./pages/DocsPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const StatusPage = React.lazy(() => import('./pages/StatusPage'));
const FAQPage = React.lazy(() => import('./pages/FAQPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const LeadsPage = React.lazy(() => import('./pages/LeadsPage'));
const DataImport = React.lazy(() => import('./pages/DataImport'));
const ScraperPage = React.lazy(() => import('./pages/ScraperPage'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const GlobalInsightsPage = React.lazy(() => import('./pages/GlobalInsightsPage'));
const KeywordIntelligencePage = React.lazy(() => import('./pages/KeywordIntelligencePage'));
const EmployeeDetailPage = React.lazy(() => import('./pages/EmployeeDetailPage'));

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0ea5e9' },
    secondary: { main: '#8b5cf6' },
    background: { default: '#060d1a', paper: '#0d1f3c' },
    text: { primary: '#f0f9ff', secondary: 'rgba(240,249,255,0.55)' },
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid rgba(255,255,255,0.06)' } } },
    MuiPopover: { styleOverrides: { paper: { bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } } },
    MuiMenu: { styleOverrides: { paper: { bgcolor: '#0d1f3c', border: '1px solid rgba(14,165,233,0.2)' } } },
    MuiMenuItem: { styleOverrides: { root: { color: '#e2f4ff' } } },
  },
});

// ── Suspense fallback ─────────────────────────────────────────
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#060d1a' }}>
    <CircularProgress sx={{ color: '#0ea5e9' }} />
  </Box>
);

function Guard({ children, adminOnly, managerOnly }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (managerOnly) {
    const isSuperAdmin = user.role === 'super_admin';
    const isLocalAdmin = isSuperAdmin || user.role === 'admin';
    const isManager = isLocalAdmin || user.role === 'manager';
    if (!isManager) return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/documentation" element={<DocsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/admin" element={<Navigate to="/dashboard" />} />

        <Route path="/" element={<Guard><AppLayout /></Guard>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="import" element={<Navigate to="/scraper" replace />} />
          <Route path="scraper" element={<ScraperPage />} />
          <Route path="insights" element={<GlobalInsightsPage />} />
          <Route path="keywords" element={<Guard managerOnly><KeywordIntelligencePage /></Guard>} />
          <Route path="team" element={<Guard managerOnly><TeamPage /></Guard>} />
          <Route path="employee/:id" element={<Guard managerOnly><EmployeeDetailPage /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{
              duration: 3500,
              style: {
                background: '#0d1f3c', color: '#f0f9ff',
                border: '1px solid rgba(14,165,233,0.2)', borderRadius: 10
              },
            }} />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
