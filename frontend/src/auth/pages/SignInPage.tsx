import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaFireAlt, FaShieldAlt, FaTrophy, FaPen } from 'react-icons/fa';
import InputField from '../components/HorizonInputField';
import { AuthService } from '../services/auth.service';
import ThemeToggle from '../components/ThemeToggle';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 max-lg:p-8">
        <div className="absolute -top-30 -right-22 size-90 rounded-full bg-primary/12 blur-[90px] opacity-50" />
        <div className="absolute -bottom-40 -left-24 size-90 rounded-full bg-secondary/20 blur-[90px] opacity-50" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-[13px] text-text tracking-wide">
            <span>VIRS Writing Challenge</span>
            <span className="text-primary">Villanova · Spring 2026</span>
          </div>

          <h1 className="mt-5 text-[clamp(34px,4vw,44px)] leading-tight font-bold">
            Villanova Writing Tracker for faculty &amp; post-docs.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-muted">
            Track daily writing sessions, build streaks, and stay motivated alongside your Villanova colleagues—all in one
            simple, transparent, semester-based platform built on trust.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm">
            <span className="inline-flex items-center gap-2 text-text/90">
              <FaPen className="text-base text-primary" aria-hidden="true" />
              Daily Writing
            </span>
            <span className="inline-flex items-center gap-2 text-text/90">
              <FaFireAlt className="text-base text-primary" aria-hidden="true" />
              Streaks
            </span>
            <span className="inline-flex items-center gap-2 text-text/90">
              <FaTrophy className="text-base text-primary" aria-hidden="true" />
              Leaderboard
            </span>
            <span className="inline-flex items-center gap-2 text-text/90">
              <FaComments className="text-base text-primary" aria-hidden="true" />
              Message Board
            </span>
            <span className="inline-flex items-center gap-2 text-text/90">
              <FaShieldAlt className="text-base text-primary" aria-hidden="true" />
              Admin Control
            </span>
          </div>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6">
        <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">Sign in to your account</h2>
            <p className="text-muted">
              Enter your credentials to access the writing challenge.
            </p>
          </div>

          {errors.general && (
            <div className="mb-3 rounded-[14px] border border-red-400/30 bg-red-500/5 p-3 text-[13px] text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-1.5 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <InputField
                variant="auth"
                label="Email"
                id="signInEmail"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                state={errors.email ? 'error' : undefined}
                disabled={isLoading}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <InputField
                variant="auth"
                label="Password"
                id="signInPassword"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
                state={errors.password ? 'error' : undefined}
                disabled={isLoading}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-muted">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/auth/sign-up')} className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer">
                Create one
              </button>
            </p>

            <p className="text-center text-sm text-muted">
              <button type="button" onClick={async () => {
                if (!email.trim()) {
                  setErrors({ email: 'Enter your email first to reset your password.' });
                  return;
                }
                try {
                  const res = await AuthService.forgotPassword(email.trim());
                  setErrors({ general: '' });
                  alert(res.message);
                } catch {
                  setErrors({ general: 'Could not send reset email. Check your email address.' });
                }
              }} className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer">
                Forgot password?
              </button>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default SignInPage;
