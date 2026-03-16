import type { User as FirebaseUser } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  firebase_uid: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordStrength {
  score: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isMinLength: boolean;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  customDepartment?: string;
}