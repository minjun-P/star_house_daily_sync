import { Company } from './entities/company';
import { StockMarketData } from './entities/stock_market_data';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import 'dotenv/config';

console.log(`-------DB ENV SETTING-------`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`POSTGRES_USER: ${process.env.POSTGRES_USER}`);
console.log(`POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD}`);
console.log(`POSTGRES_DB: ${process.env.POSTGRES_DB}`);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Company, StockMarketData],
  namingStrategy: new SnakeNamingStrategy(),
  migrations: ['src/migrations/*.ts'],
});
