import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { FaPen, FaFireAlt, FaTrophy, FaComments } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
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

      {/* Hero */}
      <section className="relative overflow-hidden !bg-[#003366] dark:!bg-slate-900 p-12 max-lg:p-8 flex items-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg1MnYxNEgzNnptMCAxNmg1MnYxNEgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-300/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-300/5 dark:bg-cyan-400/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm px-4 py-2.5 text-[16px] font-semibold text-white shadow-lg border border-white/20 dark:border-white/10">
            <span>VIRS Writing Challenge</span>
          </div>

          <h1 className="mt-8 text-[clamp(38px,4.5vw,52px)] leading-[1.1] font-black text-white">
            Join Our Writing Challenge
          </h1>
          <p className="mt-6 max-w-xl text-[18px] leading-[1.75] text-white/95 dark:text-white/90 font-medium">
            Join Villanova faculty and post-docs in building consistent writing habits. Track sessions, celebrate streaks, and stay motivated with your academic community.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-lg">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/15 dark:border-white/10">
              <FaPen className="text-2xl text-white mb-2" aria-hidden="true" />
              <div className="text-white font-bold text-sm">Daily Writing</div>
              <div className="text-white/80 dark:text-white/70 text-xs mt-1">Track your progress</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/15 dark:border-white/10">
              <FaFireAlt className="text-2xl text-orange-300 dark:text-orange-400 mb-2" aria-hidden="true" />
              <div className="text-white font-bold text-sm">Build Streaks</div>
              <div className="text-white/80 dark:text-white/70 text-xs mt-1">Stay consistent</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/15 dark:border-white/10">
              <FaTrophy className="text-2xl text-yellow-300 dark:text-yellow-400 mb-2" aria-hidden="true" />
              <div className="text-white font-bold text-sm">Leaderboard</div>
              <div className="text-white/80 dark:text-white/70 text-xs mt-1">Friendly competition</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/15 dark:border-white/10">
              <FaComments className="text-2xl text-blue-200 dark:text-blue-300 mb-2" aria-hidden="true" />
              <div className="text-white font-bold text-sm">Community</div>
              <div className="text-white/80 dark:text-white/70 text-xs mt-1">Connect & share</div>
            </div>
          </div>
        </div>
      </section>

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
