export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    privateKey: string;
    publicKey: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    superAdminSecret: string;
    superAdminExpiresIn: string;
  };
  encryption: {
    key: string;
  };
  cors: {
    origins: string[];
  };
  msg91: {
    authKey: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  database: {
    url: process.env['DATABASE_URL']!,
  },
  jwt: {
    privateKey: process.env['JWT_PRIVATE_KEY']!,
    publicKey: process.env['JWT_PUBLIC_KEY']!,
    accessTokenExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
    refreshTokenExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
    superAdminSecret: process.env['JWT_SUPER_ADMIN_SECRET']!,
    superAdminExpiresIn: process.env['JWT_SUPER_ADMIN_EXPIRES_IN'] ?? '8h',
  },
  encryption: {
    key: process.env['ENCRYPTION_KEY']!,
  },
  cors: {
    origins: process.env['CORS_ORIGINS']
      ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
      : ['http://localhost:3000'],
  },
  msg91: {
    authKey: process.env['MSG91_AUTH_KEY'] ?? '',
  },
});
