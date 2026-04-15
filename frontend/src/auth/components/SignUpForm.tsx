import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { useFormValidation } from '../hooks/useFormValidation';
import { AuthService } from '../services/auth.service';
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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [signUpMessage, setSignUpMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasSpecial: false,
    hasNumber: false,
  });
  const [confirmPasswordMatch, setConfirmPasswordMatch] = useState(false);

  const validateName = (name: string, fieldName: string): string => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s-']+$/.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (id === 'password') {
      checkPasswordStrength(value);
    }
    if (id === 'confirmPassword') {
      setConfirmPasswordMatch(value === formData.password);
    }
    if (errors[id as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
    }

    if (error) {
      setErrors(prev => ({ ...prev, [id]: error }));
    }
  };

  const checkPasswordStrength = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    setPasswordChecks({ hasUppercase, hasLowercase, hasSpecial, hasNumber });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.firstName = validateName(formData.firstName, 'First name');
    newErrors.lastName = validateName(formData.lastName, 'Last name');
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);

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
      const response = await AuthService.signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
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
        <p className="max-w-sm rounded-xl border border-green-400/30 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {signUpMessage}
        </p>
        <p className="max-w-sm text-sm text-muted">
          We sent a verification link to <span className="font-semibold text-text">{sentToEmail}</span>.
          Click the link in your inbox (check spam too), then sign in.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 w-full rounded-xl bg-primary py-3.5 text-base font-medium text-white transition duration-200 hover:bg-primary/90 active:bg-primary/80"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-text mb-2">
            First Name
          </label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
            <input
              id="firstName"
              type="text"
              placeholder="Jane"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                errors.firstName
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            />
          </div>
          {errors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-text mb-2">
            Last Name
          </label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                errors.lastName
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            />
          </div>
          {errors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
          Work Email
        </label>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
          <input
            id="email"
            type="email"
            placeholder="mail@example.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
              errors.email
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
          Password
        </label>
        <div className="relative">
          <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
              errors.password
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-text transition-colors duration-200"
            disabled={isLoading}
          >
            {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
          </button>
        </div>

        {formData.password && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1 ${passwordChecks.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-muted'}`}>
              <FaCheckCircle size={12} />
              Uppercase letter
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-muted'}`}>
              <FaCheckCircle size={12} />
              Lowercase letter
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted'}`}>
              <FaCheckCircle size={12} />
              Number
            </div>
            <div className={`flex items-center gap-1 ${passwordChecks.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-muted'}`}>
              <FaCheckCircle size={12} />
              Special character
            </div>
          </div>
        )}

        {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <FaShieldAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors duration-200" size={20} />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-background text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
              errors.confirmPassword
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                : formData.confirmPassword && confirmPasswordMatch
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-text transition-colors duration-200"
            disabled={isLoading}
          >
            {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-primary py-3.5 text-base font-medium text-white transition duration-200 hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating account...
          </div>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="mt-4">
        <span className="text-sm font-medium text-text">
          Already have an account?
        </span>
        <button
          type="button"
          onClick={() => navigate('/auth/sign-in')}
          className="ml-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          disabled={isLoading}
        >
          Sign in here
        </button>
      </div>
    </form>
  );
};

export default SignUpForm;
