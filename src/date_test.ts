import { AppDataSource } from './data_source';
import { StockMarketData } from './entities/stock_market_data';

// AppDataSource.initialize().then(async () => {
//   const marketRepo = AppDataSource.getRepository(StockMarketData);
//   const marketData = await marketRepo.find({
//     where: {
//       company: {
//         symbol: 'BTM',
//       },
//     },
//     take: 5,
//     order: {
//       date: 'DESC',
//     },
//   });
//   console.log(marketData);
//   // const date = marketData?.date;
//   // if (date) {
//   //   console.log(typeof date);
//   // }
//   // console.log(marketData?.date);
// });
console.log('Hello, world!');
