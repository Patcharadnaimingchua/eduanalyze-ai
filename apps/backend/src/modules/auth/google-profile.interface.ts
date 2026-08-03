// Normalized shape GoogleStrategy.validate() attaches to request.user —
// deliberately minimal, distinct from RequestUser (which represents an
// authenticated EduAnalyzeAI account, not a raw external identity).
export interface GoogleProfile {
  email: string;
  googleId: string;
  fullName: string;
}
