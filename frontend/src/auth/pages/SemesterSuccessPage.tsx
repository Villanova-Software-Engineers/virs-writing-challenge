import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { FaPen, FaFireAlt, FaTrophy, FaComments } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
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
            Track Your Writing Journey
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
