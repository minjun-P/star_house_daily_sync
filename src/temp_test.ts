import { Company } from './entities/company';
import { AppDataSource } from './data_source';
import { StockMarketData } from './entities/stock_market_data';

AppDataSource.initialize().then(async () => {
  // const marketRepo = AppDataSource.getRepository(StockMarketData);
  // const testEntity = new StockMarketData();
  // testEntity.date = new Date();
  // const companyEntity = await AppDataSource.getRepository(Company).find({
  //   take: 1,
  //   where: {
  //     id: 20,
  //   },
  // });
  // if (!companyEntity) {
  //   throw new Error('No company entity found');
  // }
  // testEntity.company = companyEntity[0];
  // testEntity.open = 2;
  // testEntity.close = 1;
  // testEntity.high = 1;
  // testEntity.low = 1;
  // testEntity.volume = 1;
  // testEntity.priceChangeRate = 1;
  // try {
  //   await marketRepo.upsert(testEntity, ['company', 'date']);
  // } catch (error) {
  //   console.log('ERROR');
  //   console.error(error);
  // }
});
