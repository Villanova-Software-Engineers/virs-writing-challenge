import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/HorizonInputField';
import { AuthService } from '../services/auth.service';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.forgotPassword(email.trim());
      setSuccess(res.message);
    } catch {
      setError('Could not send reset email. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
      <ThemeToggle />

      <div className="w-full max-w-[440px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold text-text">Reset your password</h2>
          <p className="text-muted">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-[14px] border border-red-400/30 bg-red-500/5 p-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 rounded-[14px] border border-green-400/30 bg-green-500/5 p-3 text-[13px] text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-1.5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <InputField
              variant="auth"
              label="Email"
              id="forgotEmail"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              state={error ? 'error' : undefined}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
          >
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-muted">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/auth/sign-in')}
              className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
