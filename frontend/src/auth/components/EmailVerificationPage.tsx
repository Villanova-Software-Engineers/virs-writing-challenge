import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import ThemeToggle from './ThemeToggle';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const firebaseUser = AuthService.getCurrentFirebaseUser();
    if (firebaseUser) {
      setUserEmail(firebaseUser.email || '');
    } else {
      navigate('/auth/sign-up');
    }
  }, [navigate]);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage('');

    try {
      const verified = await AuthService.checkEmailVerification();

      if (verified) {
        setIsVerified(true);
        setMessage('Email verified successfully! Redirecting to sign in...');

        setTimeout(async () => {
          await AuthService.signOut();
          navigate('/auth/sign-in');
        }, 1800);
      } else {
        setMessage('Not verified yet. Click the link in your inbox, then try again.');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to check verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage('');

    try {
      const response = await AuthService.resendVerificationEmail();
      setMessage(response.message);
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignIn = async () => {
    await AuthService.signOut();
    navigate('/auth/sign-in');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
      <ThemeToggle />
      <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Email verification
          </span>
          <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">{isVerified ? 'All set!' : 'Check your inbox'}</h2>
          <p className="text-muted">
            {isVerified
              ? 'Your email is verified. Continue to sign in.'
              : `We sent a link to ${userEmail || 'your email address'}. Click it, then confirm below.`}
          </p>
        </div>

        {message && (
          <div className={`mb-3 rounded-[14px] border p-3 text-[13px] ${
            isVerified || message.includes('sent')
              ? 'border-green-400/30 bg-green-500/5 text-green-600'
              : 'border-red-400/30 bg-red-500/5 text-red-600'
          }`}>
            {message}
          </div>
        )}

        {!isVerified ? (
          <div className="mt-1.5 flex flex-col gap-3.5">
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              type="button"
              className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
            >
              {isChecking ? 'Checking…' : "I've verified my email"}
            </button>
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              type="button"
              className="w-full rounded-[14px] border border-accent/20 bg-text/5 px-3 py-3 text-sm font-semibold text-text transition-all hover:border-text/20 hover:bg-text/10 disabled:opacity-65 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending…' : 'Resend verification email'}
            </button>
            <button
              onClick={handleBackToSignIn}
              type="button"
              className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer"
            >
              &larr; Back to sign in
            </button>
          </div>
        ) : (
          <button
            onClick={handleBackToSignIn}
            type="button"
            className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
          >
            Go to sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
