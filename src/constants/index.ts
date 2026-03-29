import { env } from "./env";

export const GOOGLE_REDIRECT_URI = `${env.EXPO_PUBLIC_BASE_URL}/api/auth/callback`;
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
