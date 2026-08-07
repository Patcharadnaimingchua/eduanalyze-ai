export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? [],
  },
  // Used only to build the post-OAuth redirect target in
  // AuthController.googleAuthCallback — the browser lands there directly
  // after Google, so it must be a real frontend URL, not the API's own.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  google: {
    // GoogleStrategy reads these directly from process.env (can't use
    // ConfigService before super() runs) — kept here too for consistency
    // with the rest of this file and for any future non-strategy use.
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Interpreting already-computed numbers into hedged prose (§25-26) is
    // not open-ended reasoning — the cheapest/fastest current model is the
    // right default; override via env if that changes.
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
  },
});
