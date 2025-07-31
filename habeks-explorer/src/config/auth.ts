// Google OAuth конфигурация
export const GOOGLE_CLIENT_ID = '958112022686-o5p2m11rs9molj9d97kkmj4h5aftrjfq.apps.googleusercontent.com';

// Типы для Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        }
      }
    }
  }
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUser {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name?: string;
  given_name?: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}

// Декодирование JWT токена
export const decodeGoogleCredential = (credential: string): GoogleUser => {
  const base64Url = credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};
