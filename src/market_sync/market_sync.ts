import { AppDataSource } from '../data_source';
import { Company } from '../entities/company';
import 'reflect-metadata';
import 'dotenv/config';
import { In } from 'typeorm';
import yahooFinance from 'yahoo-finance2';
import { StockMarketData } from '../entities/stock_market_data';
import { EXCHANGE_NATION_MAP, InterestingExchange } from '../core';
import { parseDateToDashFormat } from '../util';
const DELAY_MS = 100;

const periodLowerBound = new Date('2020-01-01');
const SAVE_BATCH_SIZE = 1000;
const { CLOUD_RUN_TASK_INDEX, CLOUD_RUN_TASK_COUNT } = process.env;

async function main() {
  await AppDataSource.initialize();
  const nationCode = process.env.NATION_CODE;
  const interestingExchanges: InterestingExchange[] =
    nationCode === 'KR'
      ? EXCHANGE_NATION_MAP['KR']
      : nationCode === 'US'
      ? EXCHANGE_NATION_MAP['US']
      : [...EXCHANGE_NATION_MAP['KR'], ...EXCHANGE_NATION_MAP['US']];

  console.log(
    `${consolePrefix()} Start Market Sync Task nationCode:${nationCode}`,
  );
  const allCompnaies = await AppDataSource.getRepository(Company).find({
    select: ['symbol', 'id', 'name', 'nation'],
    where: {
      exchangeShortName: In(interestingExchanges),
    },
  });
  const filteredCompaniesByTaskNumber = allCompnaies.filter((company) => {
    return (
      company.id % Number(CLOUD_RUN_TASK_COUNT ?? 1000) ===
      Number(CLOUD_RUN_TASK_INDEX ?? 0)
    );
  });
  console.log(
    `${consolePrefix()} Target Companies Length : `,
    filteredCompaniesByTaskNumber.length,
  );
  const marketDataRepository = AppDataSource.getRepository(StockMarketData);
  const latestMarketDates = await AppDataSource.getRepository(StockMarketData)
    .createQueryBuilder('stockData')
    .select(`to_char(MAX(stockData.date)::DATE, 'YYYY-MM-dd')`, 'latestDate')
    .addSelect('stockData.company_id', 'companyId')
    .where('stockData.company_id IN (:...targetCompanyIds)', {
      targetCompanyIds: filteredCompaniesByTaskNumber.map(
        (company) => company.id,
      ),
    }) // WHERE 조건 추가
    .groupBy('stockData.company_id')
    .getRawMany();

  const latestDatesMap = new Map(
    latestMarketDates.map((row) => [
      Number(row.companyId),
      new Date(row.latestDate),
    ]),
  );
  console.log(latestDatesMap);
  console.log(`${consolePrefix()} Fetching Latest Market Dates Done`);

  let marketDataEntitiesToSave: StockMarketData[] = [];

  for (let i = 0; i < filteredCompaniesByTaskNumber.length; i += 1) {
    const targetCompnay = filteredCompaniesByTaskNumber[i];
    // first, check each companies' aleary fetched, latest  market data date

    const latestFetchedMarketDate = latestDatesMap.get(targetCompnay.id);
    let queryStartDate = periodLowerBound;
    if (latestFetchedMarketDate) {
      queryStartDate = new Date(latestFetchedMarketDate);
      queryStartDate.setDate(queryStartDate.getDate() + 1);
    }
    if (queryStartDate > new Date()) {
      console.log(
        `${consolePrefix()} Company ${targetCompnay.name}(${
          targetCompnay.symbol
        }) is already up-to-date`,
      );
      continue;
    }
    console.log(
      `${consolePrefix()} Fetching Market Data for Company : ${
        targetCompnay.name
      }(${targetCompnay.symbol}) from ${queryStartDate.toISOString()}`,
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
      const date = new Date(parseDateToDashFormat(quote.date));
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

    const notNullEntities = entities.filter((e) => e !== null);

    // date를 기준으로 중복 제거
    const uniqueEntities = notNullEntities.filter((entity, index, self) => {
      const uniqueAmongEntities =
        index ===
        self.findIndex((t) => t.date.getTime() === entity.date.getTime());
      if (latestFetchedMarketDate) {
        return (
          entity.date.getTime() > latestFetchedMarketDate.getTime() &&
          uniqueAmongEntities
        );
      }
      return uniqueAmongEntities;
    });
    console.log(
      `${consolePrefix()} Remove Redundance of Date Process Done, (Before: ${
        notNullEntities.length
      }, After: ${uniqueEntities.length})`,
    );
    
    marketDataEntitiesToSave.push(...uniqueEntities);

    const totalBatchCycleCount = Math.ceil(
      marketDataEntitiesToSave.length / SAVE_BATCH_SIZE,
    );
    if (marketDataEntitiesToSave.length > 10000) {
      for (let i = 0; i < marketDataEntitiesToSave.length; i += SAVE_BATCH_SIZE) {
        console.log(
          `${consolePrefix()} Saving Batch... ${
            Math.floor(i / SAVE_BATCH_SIZE) + 1
          }/ ${totalBatchCycleCount}`,
        );
        const slicedEntities = marketDataEntitiesToSave.slice(
          i,
          i + SAVE_BATCH_SIZE,
        );
        console.log(`${consolePrefix()} Saving Entities...`);
        await marketDataRepository.insert(slicedEntities);
        marketDataEntitiesToSave = [];
      }
    }
  }
  if (marketDataEntitiesToSave.length > 0) {
    console.log(`${consolePrefix()} Saving Remain Entities...`);
    await marketDataRepository.insert(marketDataEntitiesToSave);
  }
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
