import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, authReady } from '../../firebase/config';
import type {
  SignInRequest,
  SignUpRequest,
  AuthResponse,
  User,
} from '../types/auth.types';

export class AuthService {
  private static buildFallbackUser(firebaseUser: FirebaseUser): User {
    const displayNameParts = (firebaseUser.displayName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = displayNameParts[0] || 'Villanova';
    const lastName = displayNameParts.slice(1).join(' ') || 'Writer';

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName,
      lastName,
      department: 'Not set',
      firebase_uid: firebaseUser.uid,
      isAdmin: false,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
    };
  }

  // Sign in with email and password
  static async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    await authReady;
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Check if email is verified (already available from signIn, no reload needed)
    if (!firebaseUser.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }

    // Start profile fetch but don't block sign-in on it
    const profilePromise = this.getUserProfile(firebaseUser.uid).catch((error) => {
      console.warn('[AuthService] Firestore profile read failed during sign-in, using fallback profile:', error);
      return null;
    });

    // Race: use profile if it resolves quickly, otherwise use fallback
    let userProfile: User | null = null;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    userProfile = await Promise.race([profilePromise, timeout]);

    if (!userProfile) {
      userProfile = this.buildFallbackUser(firebaseUser);
      // Continue fetching profile in background for backfill if needed
      profilePromise.then((profile) => {
        if (!profile) {
          this.createUserProfile({
            id: userProfile!.id,
            email: userProfile!.email,
            firstName: userProfile!.firstName,
            lastName: userProfile!.lastName,
            department: userProfile!.department,
            firebase_uid: userProfile!.firebase_uid,
            isAdmin: false,
            emailVerified: firebaseUser.emailVerified,
          }).catch((error) => {
            console.warn('[AuthService] Firestore profile backfill failed:', error);
          });
        }
      });
    }

    return {
      success: true,
      user: userProfile,
    };
  }

  // Sign up - POST /users
  static async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    await authReady;
    const { email, password, firstName, lastName, department } = userData;

    // Create Firebase auth user — this is the critical step.
    // Once this succeeds the account exists and we can show success immediately.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const user: Omit<User, 'createdAt'> = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      firstName,
      lastName,
      department,
      firebase_uid: firebaseUser.uid,
      isAdmin: false,
      emailVerified: false,
    };

    // Require verification email send to succeed before returning success to UI.
    await sendEmailVerification(firebaseUser, {
      url: window.location.origin + '/auth/verify-email',
      handleCodeInApp: false,
    });

    //Continue profile tasks in background.
    Promise.allSettled([
      updateProfile(firebaseUser, { displayName: `${firstName} ${lastName}` }),
      this.createUserProfile(user),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[AuthService] Background task ${i} failed:`, r.reason);
        }
      });
    });

    return {
      success: true,
      user: { ...user, createdAt: new Date() },
      message: 'Account created and verification email sent. Please check your inbox (and spam folder).',
    };
  }

  // Create user profile in Firestore
  private static async createUserProfile(user: Omit<User, 'createdAt'>): Promise<void> {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      createdAt: new Date(),
    });
  }

  // Get user profile from Firestore
  static async getUserProfile(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      firebase_uid: data.firebase_uid,
      isAdmin: data.isAdmin || false,
      emailVerified: data.emailVerified || false,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }

  // Resend verification email
  static async resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    await authReady;
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      throw new Error('No user is currently signed in');
    }

    if (firebaseUser.emailVerified) {
      return {
        success: false,
        message: 'Your email is already verified',
      };
    }

    console.log('[AuthService] Resending verification email to:', firebaseUser.email);
    
    try {
      await sendEmailVerification(firebaseUser, {
        url: window.location.origin + '/auth/verify-email',
        handleCodeInApp: false,
      });
      console.log('[AuthService] Verification email resent successfully');
    } catch (error: any) {
      console.error('[AuthService] Failed to resend verification email:', error);
      console.error('[AuthService] Error code:', error.code);
      throw error;
    }
    
    return {
      success: true,
      message: 'Verification email sent! Please check your inbox and spam folder.',
    };
  }

  // Check and update email verification status
  static async checkEmailVerification(): Promise<boolean> {
    await authReady;
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return false;
    }

    //Reload user to get latest verification status
    await firebaseUser.reload();
    
    // Update Firestore if verification status changed
    if (firebaseUser.emailVerified) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, { emailVerified: true }, { merge: true });
    }

    return firebaseUser.emailVerified;
  }

  // Sign out
  static async signOut(): Promise<void> {
    await authReady;
    await firebaseSignOut(auth);
  }

  // Send password reset email
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await authReady;
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  // Get current Firebase user
  static getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Subscribe to auth state changes
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}
