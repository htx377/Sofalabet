import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Warn if JWT_SECRET is missing in production, but don't crash to allow the app to start
if (isProduction && !process.env.JWT_SECRET) {
  console.warn('⚠️ CRITICAL: JWT_SECRET environment variable is missing in production!');
  console.warn('⚠️ Using a default fallback secret. PLEASE SET A SECURE JWT_SECRET IN SETTINGS IMMEDIATELY!');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_only_for_local_development_do_not_use_in_prod',
  jwtExpiresIn: '7d',
  limits: {
    minimumStake: parseFloat(process.env.MINIMUM_STAKE || '20'),
    maximumStake: parseFloat(process.env.MAXIMUM_STAKE || '50000'),
    maximumPotentialWin: parseFloat(process.env.MAXIMUM_POTENTIAL_WIN || '1000000'),
  },
  currency: 'MZN',
  isTestMode: !isProduction, // In-memory/test only when not production unless configured
};
