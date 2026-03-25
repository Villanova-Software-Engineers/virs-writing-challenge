import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import InputField from '../components/HorizonInputField';
import { useProfile, useActiveSemester, useJoinSemester } from '../../hooks/useApi';

const ProfessorCodePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: activeSemester, isLoading: semesterLoading } = useActiveSemester();
  const joinSemesterMutation = useJoinSemester();

  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  // Check if user already has a current semester OR is admin
  useEffect(() => {
    if (profile?.is_admin) {
      // Admins don't need to join a semester - skip to dashboard
      navigate('/dashboard');
    } else if (profile?.current_semester?.is_active) {
      // User already joined, redirect to dashboard
      navigate('/dashboard');
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid access code. Please try again.');
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
    <div className="flex min-h-screen items-center justify-center p-12 text-text tracking-tight max-lg:p-6">
      <ThemeToggle />
      <div className="w-full max-w-[560px] rounded-[22px] border border-accent/20 bg-background p-7 shadow-xl backdrop-blur-xl">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Semester Access
          </span>
          <h2 className="mt-2.5 mb-1.5 text-[26px] font-bold">Enter semester access code</h2>
          <p className="text-muted">
            {email ? `Signed in as ${email}.` : 'Signed in successfully.'} Your professor will provide the semester access code.
          </p>
        </div>

        <div className="mt-1.5 flex flex-col gap-3.5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <InputField
              variant="auth"
              label="Access Code"
              id="professorAuthCode"
              type="text"
              placeholder="Enter code from professor"
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
            className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
          >
            {joinSemesterMutation.isPending ? 'Joining...' : 'Join Semester'}
          </button>

          {!activeSemester && (
            <p className="text-center text-sm text-orange-600">
              No active semester available. Contact your administrator.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorCodePage;
