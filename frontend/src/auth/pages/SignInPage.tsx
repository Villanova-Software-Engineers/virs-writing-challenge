import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaFireAlt, FaShieldAlt, FaTrophy, FaPen, FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import { AuthService } from '../services/auth.service';
import ThemeToggle from '../components/ThemeToggle';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setIsLoading(true);
    try {
      await AuthService.signIn({
        email: email.trim(),
        password,
      });
      navigate('/auth/professor-code', { state: { email: email.trim() } });
    } catch (error: any) {
      const message = error?.message || 'Sign-in failed. Please try again.';
      if (message.includes('verify your email')) {
        setErrors({
          general: 'Please verify your email before signing in. Open your inbox and confirm your account first.',
        });
      } else if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        setErrors({ general: 'Invalid email or password.' });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <ThemeToggle />

      {/* Hero */}
      <section className="relative overflow-hidden !bg-[#003366] dark:!bg-slate-900 p-12 max-lg:p-8 flex items-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg1MnYxNEgzNnptMCAxNmg1MnYxNEgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-300/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-300/5 dark:bg-cyan-400/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg border border-white/20 dark:border-white/10">
            <span>VIRS Writing Challenge</span>
            <span className="opacity-90">Villanova · Spring 2026</span>
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

      {/* Sign-in panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <h2 className="mb-2.5 text-4xl font-bold text-text">Sign In</h2>
            <p className="ml-1 text-base text-muted">
              Enter your email and password to sign in!
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
              <span className="text-red-700 dark:text-red-300 text-sm">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="signInEmail" className="block text-sm font-medium text-text mb-2">
                Email*
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
                <input
                  id="signInEmail"
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                  disabled={isLoading}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                    errors.email
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-100'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="signInPassword" className="block text-sm font-medium text-text mb-2">
                Password*
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
                <input
                  id="signInPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
                  disabled={isLoading}
                  className={`w-full pl-12 pr-14 py-3.5 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                    errors.password
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-100'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted hover:text-text transition-colors duration-200 p-1 rounded-md"
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/auth/forgot-password')}
                className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-medium text-white transition duration-200 hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="mt-4">
              <span className="text-sm font-medium text-text">
                Not registered yet?
              </span>
              <button
                type="button"
                onClick={() => navigate('/auth/sign-up')}
                className="ml-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                disabled={isLoading}
              >
                Create an account
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default SignInPage;
