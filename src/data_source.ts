import { Company } from './entities/company';
import { StockMarketData } from './entities/stock_market_data';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'db',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'postgres',
  entities: [Company, StockMarketData],
  synchronize: true,
  logging: true,
});
