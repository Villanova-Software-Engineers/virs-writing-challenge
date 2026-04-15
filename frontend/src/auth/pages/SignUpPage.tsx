import React from 'react';
import SignUpForm from '../components/SignUpForm';
import ThemeToggle from '../components/ThemeToggle';
import AuthHero from '../components/AuthHero';

const SignUpPage: React.FC = () => {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <ThemeToggle />

      <AuthHero subtitle="Create your account to start tracking writing sessions, building streaks, and staying motivated alongside your Villanova colleagues." />

      {/* Sign-up panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <h2 className="mb-2.5 text-4xl font-bold text-text">Sign Up</h2>
            <p className="ml-1 text-base text-muted">
              Enter your information to create an account!
            </p>
          </div>

          <SignUpForm />
        </div>
      </section>
    </div>
  );
};

export default SignUpPage;
