import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .required(),

  PORT: Joi.number().port().required(),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_PRIVATE_KEY: Joi.string().min(1).required(),

  JWT_PUBLIC_KEY: Joi.string().min(1).required(),

  ENCRYPTION_KEY: Joi.string().hex().length(64).required(),

  JWT_SUPER_ADMIN_SECRET: Joi.string().min(32).required(),

  // Optional variables with defaults
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_SUPER_ADMIN_EXPIRES_IN: Joi.string().default('8h'),
  CORS_ORIGINS: Joi.string().optional(),
});
