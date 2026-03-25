import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SignUpPage from "./auth/pages/SignUpPage";
import EmailVerificationPage from "./auth/components/EmailVerificationPage";
import SignInPage from "./auth/pages/SignInPage";
import ProfessorCodePage from "./auth/pages/ProfessorCodePage";
import NavBar from "./components/NavBar";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import MessageBoard from "./components/MessageBoard";
import Leaderboard from "./components/Leaderboard";
import AdminPage from "./components/admin/AdminPage";
import { useAuth } from "./providers/AuthProvider";

// Protected route wrapper - redirects to sign-in if not authenticated
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return children;
}

// Public route wrapper - redirects to dashboard if already authenticated
function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Admin-only route wrapper
function AdminRoute({ children }) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Admin layout with admin navbar
function AdminLayout() {
  return (
    <AdminRoute>
      <div className="flex min-h-screen">
        <main className="flex-1 overflow-y-auto">
          <AdminPage />
        </main>
      </div>
    </AdminRoute>
  );
}

// Regular app layout with user navbar
function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <NavBar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<MessageBoard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><SignInPage /></PublicRoute>} />
        <Route path="/auth/sign-in" element={<PublicRoute><SignInPage /></PublicRoute>} />
        <Route path="/auth/sign-up" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/auth/professor-code" element={<ProfessorCodePage />} />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
