import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'zonabet_production_super_secret_jwt_key_2026',
  jwtExpiresIn: '7d',
  limits: {
    minimumStake: parseFloat(process.env.MINIMUM_STAKE || '20'), // 20 MZN (20 MT)
    maximumStake: parseFloat(process.env.MAXIMUM_STAKE || '50000'), // 50,000 MZN
    maximumPotentialWin: parseFloat(process.env.MAXIMUM_POTENTIAL_WIN || '1000000'), // 1,000,000 MZN
  },
  currency: 'MZN',
  isTestMode: true, // virtual balance environment
};
