export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this',
  expiresIn: process.env.JWT_EXPIRE || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  issuer: 'automated-assessment-system',
  audience: 'assessment-api',
};

export default jwtConfig;
