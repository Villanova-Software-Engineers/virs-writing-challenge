import React from 'react';
import { FaPen, FaFireAlt, FaTrophy, FaComments } from 'react-icons/fa';

interface AuthHeroProps {
  subtitle?: string;
}

const AuthHero: React.FC<AuthHeroProps> = ({
  subtitle = "Join Villanova faculty and post-docs in building consistent writing habits. Track sessions, celebrate streaks, and stay motivated with your academic community."
}) => {
  return (
    <section className="relative overflow-hidden !bg-[#003366] dark:!bg-slate-900 p-12 max-lg:p-8 flex items-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg1MnYxNEgzNnptMCAxNmg1MnYxNEgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-300/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-300/5 dark:bg-cyan-400/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm px-4 py-2.5 text-[16px] font-semibold text-white shadow-lg border border-white/20 dark:border-white/10">
          <span>ORDSS Writing Challenge</span>
        </div>

        <h1 className="mt-8 text-[clamp(38px,4.5vw,52px)] leading-[1.1] font-black text-white">
          Join Our Writing Challenge
        </h1>
        <p className="mt-6 max-w-xl text-[18px] leading-[1.75] text-white/95 dark:text-white/90 font-medium">
          {subtitle}
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
  );
};

export default AuthHero;
