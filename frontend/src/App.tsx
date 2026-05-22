import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import RootLayout from "./components/RootLayout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Apply from "./pages/Apply";
import BlogList from "./pages/BlogList";
import BlogArticle from "./pages/BlogArticle";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Continue from "./pages/Continue";
import Consult from "./pages/Consult";
import Contact from "./pages/Contact";
import PremiumDashboardPage from "./pages/PremiumDashboardPage";
import TrialDashboard from "./pages/TrialDashboard";
import Privacy from "./pages/Privacy";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import ProgramsTrial from "./pages/ProgramsTrial";
import TrialSuccess from "./pages/TrialSuccess";
import Refund from "./pages/Refund";
import ShippingPolicy from "./pages/ShippingPolicy";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Team from "./pages/Team";
import Terms from "./pages/Terms";
import Testimonials from "./pages/Testimonials";
import NotFound from "./pages/NotFound";
import FreeLeadMagnet from "./pages/FreeLeadMagnet";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "@admin/pages/AdminDashboard";
import AdminContentList from "@admin/pages/AdminContentList";
import AdminContentForm from "@admin/pages/AdminContentForm";
import AdminLeads from "@admin/pages/AdminLeads";
import AdminTrialOverview from "@admin/pages/AdminTrialOverview";
import AdminTrialUsers from "@admin/pages/AdminTrialUsers";
import AdminTrialUserDetail from "@admin/pages/AdminTrialUserDetail";
import AdminTrialFeedback from "@admin/pages/AdminTrialFeedback";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Wraps the bulk of the site in the navbar/footer chrome.
// Lead-funnel pages (/free/:slug) deliberately bypass this and render
// their own minimal top bar to keep focus on conversion.
function ChromeLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Standalone (no navbar) — Instagram landing pages */}
        <Route path="/free/:slug" element={<FreeLeadMagnet />} />

        {/* Standalone auth pages — full-screen, no chrome */}
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/login" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />

        {/* Admin portal — guarded inside each page via AdminGuard */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/content" element={<AdminContentList />} />
        <Route path="/admin/content/new" element={<AdminContentForm />} />
        <Route path="/admin/content/:id/edit" element={<AdminContentForm />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
        {/* Trial oversight — Ron's super-admin pages */}
        <Route path="/admin/trial" element={<AdminTrialOverview />} />
        <Route path="/admin/trial/users" element={<AdminTrialUsers />} />
        <Route
          path="/admin/trial/users/:id"
          element={<AdminTrialUserDetail />}
        />
        <Route path="/admin/trial/feedback" element={<AdminTrialFeedback />} />

        {/* Everything else gets the BigRonJones chrome */}
        <Route element={<ChromeLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/success" element={<CheckoutSuccess />} />
          <Route path="/cancel" element={<Navigate to="/checkout" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TrialDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/premium"
            element={
              <ProtectedRoute>
                <PremiumDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/continue" element={<Continue />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/programs" element={<Programs />} />
          {/* Trial sales page must be matched before /:slug to avoid the
              dynamic route swallowing it. */}
          <Route path="/programs/trial" element={<ProgramsTrial />} />
          <Route path="/programs/:slug" element={<ProgramDetail />} />
          <Route path="/trial/success" element={<TrialSuccess />} />
          <Route
            path="/trial/dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/trial/continue"
            element={<Navigate to="/continue" replace />}
          />
          <Route path="/refund" element={<Refund />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:slug" element={<ProductDetail />} />
          <Route path="/team" element={<Team />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
