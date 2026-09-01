// Payload of the short-lived "pending 2FA" token — deliberately minimal
// (just enough to identify who passed the first factor) unlike JwtPayload,
// which also carries roles/email for full session use. Jwt2faPendingStrategy
// re-resolves everything else live from the database, same "always
// resolve live" principle as JwtStrategy/JwtRefreshStrategy.
export interface TwoFactorPendingPayload {
  sub: string;
}
