import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './HorizonInputField';
import { useFormValidation } from '../hooks/useFormValidation';
import { AuthService } from '../services/auth.service';
import { DEPARTMENTS } from "../../constants/departments";
import type { FormErrors } from '../types/auth.types';

interface SignUpFormProps {
  onSuccess?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { validateEmail, validatePassword, validateConfirmPassword } = useFormValidation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    customDepartment: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [signUpMessage, setSignUpMessage] = useState('');

  const validateName = (name: string, fieldName: string): string => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s-']+$/.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return '';
  };

  const validateDepartment = (): string => {
    if (!formData.department) return 'Please select a department';
    if (formData.department === 'Other' && !formData.customDepartment.trim()) {
      return 'Please enter your department';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    let error = '';

    switch (id) {
      case 'firstName':
        error = validateName(value, 'First name');
        break;
      case 'lastName':
        error = validateName(value, 'Last name');
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password, value);
        break;
      case 'department':
        error = validateDepartment();
        break;
      case 'customDepartment':
        if (formData.department === 'Other') {
          error = value.trim() ? '' : 'Please enter your department';
        }
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [id]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.firstName = validateName(formData.firstName, 'First name');
    newErrors.lastName = validateName(formData.lastName, 'Last name');
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
    newErrors.department = validateDepartment();

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const finalDepartment = formData.department === 'Other'
        ? formData.customDepartment.trim()
        : formData.department;

      const response = await AuthService.signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        department: finalDepartment,
      });

      setSentToEmail(formData.email.trim());
      setSignUpMessage(response.message || 'Account created and verification email sent.');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in instead.' }));
      } else if (error.code === 'auth/weak-password') {
        setErrors(prev => ({ ...prev, password: 'Password is too weak. Please use a stronger password.' }));
      } else if (error.code === 'auth/invalid-email') {
        setErrors(prev => ({ ...prev, email: 'Invalid email address.' }));
      } else {
        setErrors(prev => ({ ...prev, email: error.message || 'Failed to create account. Please try again.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sentToEmail) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-3xl">
          &#9993;
        </div>
        <h3 className="text-lg font-bold text-text">Check your email</h3>
        <p className="max-w-sm rounded-[12px] border border-green-400/30 bg-green-500/5 px-3 py-2 text-sm text-green-700">
          {signUpMessage}
        </p>
        <p className="max-w-sm text-sm text-muted">
          We sent a verification link to <span className="font-semibold text-text">{sentToEmail}</span>.
          Click the link in your inbox (check spam too), then sign in.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-1.5 flex flex-col gap-3.5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div>
          <InputField
            variant="auth"
            label="First name"
            id="firstName"
            type="text"
            placeholder="Jane"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            state={errors.firstName ? 'error' : undefined}
            disabled={isLoading}
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
        </div>

        <div>
          <InputField
            variant="auth"
            label="Last name"
            id="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            state={errors.lastName ? 'error' : undefined}
            disabled={isLoading}
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <InputField
          variant="auth"
          label="Work email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          state={errors.email ? 'error' : undefined}
          disabled={isLoading}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <InputField
          variant="auth"
          label="Password"
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          state={errors.password ? 'error' : undefined}
          disabled={isLoading}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        <p className="text-xs text-muted">Use at least 1 upper, 1 number, and 1 special character.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <InputField
          variant="auth"
          label="Confirm password"
          id="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          state={errors.confirmPassword ? 'error' : undefined}
          disabled={isLoading}
        />
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="department" className="block text-xs font-semibold text-muted tracking-wide">Department</label>
        <select
          id="department"
          value={formData.department}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          className={`w-full rounded-[14px] border bg-background px-3.5 py-3 text-sm text-text transition-all hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_4px_rgba(0,75,145,0.18)] focus:outline-none ${
            errors.department ? 'border-red-400/50 shadow-[0_0_0_4px_rgba(248,113,113,0.12)]' : 'border-accent/20'
          } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <option value="">Select a department</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
      </div>

      {formData.department === 'Other' && (
        <div className="flex flex-col gap-1.5">
          <InputField
            variant="auth"
            label="Enter your department"
            id="customDepartment"
            type="text"
            placeholder="e.g., Research & Development"
            value={formData.customDepartment}
            onChange={handleChange}
            onBlur={handleBlur}
            state={errors.customDepartment ? 'error' : undefined}
            disabled={isLoading}
          />
          {errors.customDepartment && <p className="text-xs text-red-500">{errors.customDepartment}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-[14px] bg-gradient-to-r from-primary to-primary/75 px-3 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-px hover:shadow-xl hover:shadow-primary/25 active:translate-y-0 disabled:opacity-65 disabled:shadow-none"
      >
        {isLoading ? 'Creating your account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/auth/sign-in')}
          className="border-none bg-transparent p-0 font-semibold text-primary cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};

export default SignUpForm;
