import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SignUpPage from "./auth/pages/SignUpPage";
import EmailVerificationPage from "./auth/components/EmailVerificationPage";
import SignInPage from "./auth/pages/SignInPage";
import ForgotPasswordPage from "./auth/pages/ForgotPasswordPage";
import ProfessorCodePage from "./auth/pages/ProfessorCodePage";
import SemesterSuccessPage from "./auth/pages/SemesterSuccessPage";
import NavBar from "./components/NavBar";
import Dashboard from "./components/Dashboard";
import Sessions from "./components/Sessions";
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

// Semester-protected route wrapper - requires semester registration (admins exempt)
function SemesterProtectedRoute({ children }) {
  const { user, profile, isLoading, isAdmin } = useAuth();

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

  // Admins don't need semester registration
  if (isAdmin) {
    return children;
  }

  // Check if user has joined a semester
  if (!profile?.current_semester?.is_active) {
    return <Navigate to="/auth/professor-code" replace />;
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
            <Route path="/dashboard" element={<SemesterProtectedRoute><Dashboard /></SemesterProtectedRoute>} />
            <Route path="/sessions" element={<SemesterProtectedRoute><Sessions /></SemesterProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<SemesterProtectedRoute><MessageBoard /></SemesterProtectedRoute>} />
            <Route path="/leaderboard" element={<SemesterProtectedRoute><Leaderboard /></SemesterProtectedRoute>} />
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
        <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/professor-code" element={<ProfessorCodePage />} />
        <Route path="/auth/semester-success" element={<ProtectedRoute><SemesterSuccessPage /></ProtectedRoute>} />
        <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
