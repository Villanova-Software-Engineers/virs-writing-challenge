import React from 'react';
import SignUpForm from '../components/SignUpForm';
import ThemeToggle from '../components/ThemeToggle';
import { FaComments, FaClock, FaFireAlt, FaTrophy, FaPen } from 'react-icons/fa';

const SignUpPage: React.FC = () => {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] text-text tracking-tight max-lg:grid-cols-1">
      <ThemeToggle />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 max-lg:hidden">
        <div className="absolute -top-30 -right-22 size-90 rounded-full bg-primary/12 blur-[90px] opacity-50" />
        <div className="absolute -bottom-40 -left-24 size-90 rounded-full bg-secondary/20 blur-[90px] opacity-50" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-[13px] text-text tracking-wide">
            <span>VIRS Writing Challenge</span>
            <span className="text-primary">Villanova · Spring 2026</span>
          </div>

          <h1 className="mt-5 text-[clamp(34px,4vw,44px)] leading-tight font-bold">
            Join the faculty writing community.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-muted">
            Create your account to start tracking writing sessions, building streaks, and staying
            motivated alongside your Villanova colleagues—all in one transparent, semester-based platform.
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
              <FaClock className="text-base text-primary" aria-hidden="true" />
              Timer
            </span>
          </div>
        </div>
      </section>

      {/* Sign-up panel */}
      <section className="flex items-center justify-center p-12 max-lg:p-6 overflow-y-auto">
        <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">Create your account</h2>
            <p className="text-muted">
              Join your Villanova cohort for the writing challenge.
            </p>
          </div>

          <SignUpForm />
        </div>
      </section>
    </div>
  );
};

export default SignUpPage;
