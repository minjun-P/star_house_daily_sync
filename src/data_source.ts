import { Company } from './entities/company';
import { StockMarketData } from './entities/stock_market_data';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import 'dotenv/config';

console.log(process.env.DB_HOST);
console.log(process.env.DB_PORT);
console.log(process.env.POSTGRES_USER);
console.log(process.env.POSTGRES_PASSWORD);
console.log(process.env.POSTGRES_DB);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Company, StockMarketData],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
});
