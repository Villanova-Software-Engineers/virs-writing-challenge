import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
      <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          <h2 className="mb-2 text-[28px] font-bold text-text">
            Successfully Registered!
          </h2>

          <p className="mb-6 text-muted">
            You've been successfully registered for the semester. Click continue to access your dashboard.
          </p>

          {profile?.current_semester && (
            <div className="mb-6 w-full rounded-lg bg-primary/5 p-4">
              <p className="text-sm font-medium text-muted">
                Semester: <span className="text-text">{profile.current_semester.name}</span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterSuccessPage;
