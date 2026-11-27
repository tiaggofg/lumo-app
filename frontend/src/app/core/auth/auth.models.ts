export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthProviders {
  googleEnabled: boolean;
  devLoginEnabled: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
