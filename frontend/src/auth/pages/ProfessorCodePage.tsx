import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import AuthHero from '../components/AuthHero';
import InputField from '../components/HorizonInputField';
import { useProfile, useActiveSemester, useJoinSemester } from '../../hooks/useApi';
import { AuthService } from '../services/auth.service';

const ProfessorCodePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: activeSemester, isLoading: semesterLoading } = useActiveSemester();
  const joinSemesterMutation = useJoinSemester();

  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check if user is admin or already has an active semester
  useEffect(() => {
    if (profile?.is_admin) {
      // Admins don't need to join a semester - skip to dashboard
      navigate('/dashboard', { replace: true });
    } else if (profile?.current_semester?.is_active) {
      // User already has an active semester - skip to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  const handleSubmit = async () => {
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    if (!activeSemester) {
      setError('No active semester found. Contact your professor.');
      return;
    }

    try {
      setError('');
      await joinSemesterMutation.mutateAsync({
        semesterId: activeSemester.id,
        accessCode: accessCode.trim(),
      });
      // Navigate to success page after joining
      navigate('/auth/semester-success', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid access code. Please try again.');
    }
  };

  const handleBackToLogin = async () => {
    try {
      setIsSigningOut(true);
      await AuthService.signOut();
      navigate('/auth/sign-in');
    } catch (err) {
      console.error('Sign out error:', err);
      // Still navigate even if sign out fails
      navigate('/auth/sign-in');
    }
  };

  if (profileLoading || semesterLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <ThemeToggle />

      <AuthHero />

      {/* Access Code Panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <h2 className="mb-4 text-4xl font-bold text-text">Enter Semester Access Code</h2>
            <p className="ml-1 text-base text-muted leading-relaxed">
              {email ? `Signed in as ${email}.` : 'Signed in successfully.'} Your admin will provide the semester access code.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <InputField
                variant="auth"
                label="Access Code"
                id="professorAuthCode"
                type="text"
                placeholder="Enter code from admin"
                value={accessCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessCode(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={joinSemesterMutation.isPending}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-medium text-white transition duration-200 hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joinSemesterMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </div>
              ) : (
                'Join Semester'
              )}
            </button>

            {!activeSemester && (
              <p className="text-center text-sm text-orange-600 dark:text-orange-400">
                No active semester available. Contact your administrator.
              </p>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={isSigningOut}
                className="text-sm text-muted hover:text-text transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? 'Signing out...' : '← Back to Login'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfessorCodePage;
