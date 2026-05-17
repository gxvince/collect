import { createPool } from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';

const databaseProviders = [
  {
    provide: 'DB_POOL',
    useFactory: async (configService) => {
      const pool = createPool({
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        user: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      return pool;
    },
    inject: [ConfigService],
  },
];

export { databaseProviders };
