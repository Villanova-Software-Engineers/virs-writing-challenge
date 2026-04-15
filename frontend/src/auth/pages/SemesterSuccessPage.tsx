import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import AuthHero from '../components/AuthHero';
import { useProfile } from '../../hooks/useApi';

const SemesterSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const handleContinue = () => {
    // Force a full page reload to ensure all state is fresh
    window.location.href = '/dashboard';
  };

  // If somehow user doesn't have semester, redirect back
  if (profile && !profile.current_semester?.is_active && !profile.is_admin) {
    navigate('/auth/professor-code', { replace: true });
    return null;
  }

  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <ThemeToggle />

      <AuthHero />

      {/* Success Panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-green-100 dark:bg-green-900/30 p-5">
              <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-500" />
            </div>

            <h2 className="mb-3 text-4xl font-bold text-text">
              Successfully Registered!
            </h2>

            <p className="mb-8 text-base text-muted">
              You've been successfully registered for the semester. Click continue to access your dashboard.
            </p>

            {profile?.current_semester && (
              <div className="mb-8 w-full rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5">
                <p className="text-sm font-medium text-muted">
                  Semester: <span className="text-text font-semibold">{profile.current_semester.name}</span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-medium text-white transition duration-200 hover:bg-primary/90 active:bg-primary/80"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SemesterSuccessPage;
