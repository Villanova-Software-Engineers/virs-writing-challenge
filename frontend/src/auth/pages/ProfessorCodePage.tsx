import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import InputField from '../components/HorizonInputField';

const ProfessorCodePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
      <ThemeToggle />
      <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Placeholder
          </span>
          <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">Enter your professor auth code</h2>
          <p className="text-muted">
            {email ? `Signed in as ${email}.` : 'Signed in successfully.'} Your professor will provide the access code.
          </p>
        </div>

        <div className="mt-1.5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <InputField
              variant="auth"
              label="Auth code"
              id="professorAuthCode"
              type="text"
              placeholder="Enter code from professor"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
          >
            Confirm (placeholder)
          </button>

          <p className="text-center text-sm text-muted">This is a temporary placeholder page for the next step in your auth flow.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorCodePage;
