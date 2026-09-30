// Compatibility export for any legacy imports. Keep a single strategy so
// authenticated requests always use the database-backed session validation.
export { JwtStrategy } from '../strategies/jwt.strategy';
