// Google sign-in is hidden unless NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true (backend routes stay in place).
export const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === 'true';
