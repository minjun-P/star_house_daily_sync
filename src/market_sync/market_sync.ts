import { AppDataSource } from '../data_source';
import { Company } from '../entities/company';
import 'reflect-metadata';
import 'dotenv/config';
import { In } from 'typeorm';
import yahooFinance from 'yahoo-finance2';
import { StockMarketData } from '../entities/stock_market_data';
const DELAY_MS = 100;
const interestingExchanges = ['NASDAQ', 'NYSE', 'AMEX', 'KSC', 'KOE'];
const periodLowerBound = new Date('2020-01-01');

const { CLOUD_RUN_TASK_INDEX, CLOUD_RUN_TASK_COUNT } = process.env;

async function main() {
  await AppDataSource.initialize();
  console.log(`${consolePrefix()} Start Market Sync Task`);
  const allCompnaies = await AppDataSource.getRepository(Company).find({
    select: ['symbol', 'id', 'name'],
    where: {
      exchangeShortName: In(interestingExchanges),
    },
  });
  const filteredCompaniesByTaskNumber = allCompnaies.filter((company) => {
    return (
      company.id % Number(CLOUD_RUN_TASK_COUNT) === Number(CLOUD_RUN_TASK_INDEX)
    );
  });
  console.log(
    `${consolePrefix()} Target Companies Length : `,
    filteredCompaniesByTaskNumber.length,
  );
  const marketDataRepository = AppDataSource.getRepository(StockMarketData);
  const latestMarketDates = await AppDataSource.getRepository(StockMarketData)
    .createQueryBuilder('stockData')
    .select('MAX(stockData.date)', 'latestDate')
    .addSelect('stockData.companyId', 'companyId')
    .where('stockData.companyId IN (:...targetCompanyIds)', {
      targetCompanyIds: filteredCompaniesByTaskNumber.map(
        (company) => company.id,
      ),
    }) // WHERE 조건 추가
    .groupBy('stockData.companyId')
    .getRawMany();

  const latestDatesMap = new Map(
    latestMarketDates.map((row) => [
      Number(row.companyId),
      new Date(row.latestDate),
    ]),
  );
  console.log(`${consolePrefix()} Fetching Latest Market Dates Done`);

  const marketDataEntitiesToSave: StockMarketData[] = [];

  for (let i = 0; i < filteredCompaniesByTaskNumber.length; i += 1) {
    const targetCompnay = filteredCompaniesByTaskNumber[i];
    // first, check each companies' aleary fetched, latest  market data date

    const latestFetchedMarketDate = latestDatesMap.get(targetCompnay.id);
    let queryStartDate = periodLowerBound;
    if (latestFetchedMarketDate) {
      queryStartDate = new Date(latestFetchedMarketDate);
      queryStartDate.setDate(queryStartDate.getDate() + 1);
    }
    console.log(
      `${consolePrefix()} Fetching Market Data for Company : ${
        targetCompnay.name
      }(${targetCompnay.symbol})`,
    );
    const quotes = await yahooFinance
      .chart(targetCompnay.symbol, {
        period1: queryStartDate,
        interval: '1d',
      })
      .then((e) => e.quotes);
    await delay(DELAY_MS);
    const entities = quotes.map((quote) => {
      const entity = new StockMarketData();
      const date = new Date(quote.date);
      const high = quote.high;
      const low = quote.low;
      const open = quote.open;
      const close = quote.adjclose ?? quote.close;
      const volume = quote.volume;
      if (
        high == null ||
        low == null ||
        open == null ||
        close == null ||
        volume == null
      ) {
        return null;
      }
      entity.date = date;
      entity.high = high;
      entity.low = low;
      entity.open = open;
      entity.close = close;
      entity.volume = volume;
      entity.priceChangeRate = (close - open) / open;
      entity.company = targetCompnay;
      return entity;
    });
    const filteredEntities = entities.filter((e) => e !== null);
    marketDataEntitiesToSave.push(...filteredEntities);
  }
  console.log(
    `${consolePrefix()} All Market Data Fetching Done, Now Saving in DB....`,
  );
  await marketDataRepository.save(marketDataEntitiesToSave);
  console.log(`${consolePrefix()} Market Sync Task Done`);
}

function consolePrefix() {
  return `[${CLOUD_RUN_TASK_INDEX}/${CLOUD_RUN_TASK_COUNT}]`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.log('ERROR OCCURED!!!!!!');
  console.error(error);
  throw error;
});
