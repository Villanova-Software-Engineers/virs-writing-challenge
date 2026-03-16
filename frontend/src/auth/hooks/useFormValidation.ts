import { useCallback } from 'react';
import type { PasswordStrength } from '../types/auth.types';

export const useFormValidation = () => {
  const validateEmail = useCallback((email: string): string => {
    if (!email) return 'Email is required';
    if (email.length > 254) return 'Email is too long';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    return '';
  }, []);

  const validatePassword = useCallback((password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUppercase) return 'Password must contain at least one uppercase letter';
    if (!hasLowercase) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return '';
  }, []);

  const getPasswordStrength = useCallback((password: string): PasswordStrength => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isMinLength = password.length >= 8;
    
    const score = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar, isMinLength]
      .filter(Boolean).length;
    
    return {
      score,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isMinLength,
    };
  }, []);

  const validateConfirmPassword = useCallback((password: string, confirmPassword: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  }, []);

  const validateName = useCallback((name: string, fieldName: string): string => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s-']+$/.test(name)) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return '';
  }, []);

  return {
    validateEmail,
    validatePassword,
    getPasswordStrength,
    validateConfirmPassword,
    validateName,
  };
};