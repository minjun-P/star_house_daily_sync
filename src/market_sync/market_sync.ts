import { AppDataSource } from '../data_source';
import { Company } from '../entities/company';
import 'reflect-metadata';
import 'dotenv/config';
import { In } from 'typeorm';
import yahooFinance from 'yahoo-finance2';
import { StockMarketData } from '../entities/stock_market_data';
import { EXCHANGE_NATION_MAP, InterestingExchange } from '../core';
import { debugLog, parseDateToDashFormat } from '../util';
import { exit } from 'process';
const DELAY_MS = 100;

const periodLowerBound = new Date('2022-01-01');
const SAVE_BATCH_SIZE = 1000;
const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_COUNT = 300 } = process.env;

async function main() {
  await AppDataSource.initialize();
  const nationCode = process.env.NATION_CODE;
  const interestingExchanges: InterestingExchange[] =
    nationCode === 'KR'
      ? EXCHANGE_NATION_MAP['KR']
      : nationCode === 'US'
      ? EXCHANGE_NATION_MAP['US']
      : [...EXCHANGE_NATION_MAP['KR'], ...EXCHANGE_NATION_MAP['US']];

  console.log(`Start Market Sync Task nationCode:${nationCode}`);
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
  console.log('STEP1) Filtering Companies By Task Number');
  debugLog(`Target Companies Length : `, filteredCompaniesByTaskNumber.length);
  const marketDataRepository = AppDataSource.getRepository(StockMarketData);
  // 무거운 쿼리이지만 desc date index를 해당 테이블에 세팅함으로써 속도 향상을 꾀하였음.
  const latestMarketDates = await marketDataRepository
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

  // 위 쿼리를 통해 어차피 max date가 없는 경우는 애초에 쿼리 결과에 포함되지 않고 생략됨.
  // 그래서 아래 map에 없는 경우에는 아예 데이터가 없는 것으로 여기고 작업하면 됨.
  const latestDatesMap = new Map(
    latestMarketDates.map((row) => [
      Number(row.companyId),
      new Date(row.latestDate),
    ]),
  );
  debugLog(`Fetching Latest Market Dates Done`);
  debugLog(`Latest Dates Map : ${latestDatesMap}`);
  console.log('STEP2) Checking Latest Market Dates Done');

  let marketDataEntitiesToSave: StockMarketData[] = [];
  let cumulativeSaveCount = 0;
  let cumulativeFetchErrorCount = 0;
  console.log('STEP3) Staring Fetching Market Data And Saving');
  for (let i = 0; i < filteredCompaniesByTaskNumber.length; i += 1) {
    const targetCompnay = filteredCompaniesByTaskNumber[i];
    // first, check each companies' aleary fetched, latest  market data date

    const latestFetchedMarketDate = latestDatesMap.get(targetCompnay.id);
    let queryStartDate = new Date(periodLowerBound);
    if (latestFetchedMarketDate) {
      queryStartDate = new Date(latestFetchedMarketDate);
      queryStartDate.setDate(queryStartDate.getDate() + 1);
    }
    if (queryStartDate > new Date()) {
      debugLog(
        `Company ${targetCompnay.name}(${targetCompnay.symbol}) is already up-to-date`,
      );
      continue;
    }
    debugLog(
      `Fetching Market Data for Company : ${targetCompnay.name}(${
        targetCompnay.symbol
      }) from ${queryStartDate.toISOString()}`,
    );
    let quotes: {
      adjclose?: number | null | undefined;
      date: Date;
      high: number | null;
      low: number | null;
      open: number | null;
      close: number | null;
      volume: number | null;
    }[];
    try {
      quotes = await yahooFinance
        .chart(targetCompnay.symbol, {
          period1: queryStartDate,
          interval: '1d',
        })
        .then((e) => e.quotes);
      await delay(DELAY_MS);
    } catch (error) {
      // 에러 발생 시 그냥 다음 회사로 넘어가도록 하자.
      console.error(
        `Error Occured while fetching market data for ${targetCompnay.name}(${targetCompnay.symbol})`,
      );
      console.log(error);
      cumulativeFetchErrorCount += 1;
      continue;
    }

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
    debugLog(
      `Remove Redundance of Date Process Done, (Before: ${notNullEntities.length}, After: ${uniqueEntities.length})`,
    );

    marketDataEntitiesToSave.push(...uniqueEntities);
    // 누적 10000개 이상 쌓였을 때 한번 저장하고 초기화해주기 || 혹은, 마지막 순회일 때 저장
    if (
      marketDataEntitiesToSave.length >= 10000 ||
      i === filteredCompaniesByTaskNumber.length - 1
    ) {
      // 반복문 순회하면 BATCH_SIZE만큼씩 나눠서 저장
      for (
        let i = 0;
        i < marketDataEntitiesToSave.length;
        i += SAVE_BATCH_SIZE
      ) {
        const slicedEntities = marketDataEntitiesToSave.slice(
          i,
          i + SAVE_BATCH_SIZE,
        );
        debugLog(`Saving Entities... In BATCH`);
        // upsert를 통해, comapny,date unique constraints를 지키며 저장한다.
        await marketDataRepository.upsert(slicedEntities, ['company', 'date']);
        cumulativeSaveCount += slicedEntities.length;
        console.log(
          `STEP3) Saving Market Data... Cumulative Count : ${cumulativeSaveCount}`,
        );
      }
      marketDataEntitiesToSave = [];
    }
  }

  console.log('STEP3) Fetching Market Data And Saving DONE');
  console.log(`----Market Sync Task Done!!-----`);
  if (cumulativeFetchErrorCount > 0) {
    console.log(`Fetch Error Count : ${cumulativeFetchErrorCount}`);
    exit(100);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.log('UNEXPECTED ERROR OCCURED!!!!!!');
  throw error;
});
