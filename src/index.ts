import { AppDataSource } from './data_source';
import { Company } from './entities/company';
import { StockMarketData } from './entities/stock_market_data';
import 'reflect-metadata';

AppDataSource.initialize()
  .then(async () => {
    // 예시 코드 - 회사 정보 추가
    // 1. 해당 테이블 전용 Repository를 불러온다.
    const companyRepository = AppDataSource.manager.getRepository(Company);
    // 2. 새로운 회사 정보를 구성한다.
    const company = new Company();
    company.name = '삼성전자';
    // 참고로 심볼의 경우에는 한국의 경우 6자리 숫자, 미국의 경우에는 1~5글자로 구성된 영어 대문자임
    company.symbol = '005930';
    // 3. 구성한 회사 정보를 저장한다.
    await companyRepository.save(company);

    // 예시 코드 - 시장 기록 생성
    // 1. 해당 테이블 전용 Repository를 불러온다.
    const stockMarketDataRepository =
      AppDataSource.manager.getRepository(StockMarketData);
    // 2. 새로운 시장 기록을 구성한다.
    const stockMarketData = new StockMarketData();
    stockMarketData.date = new Date('2021-01-01');
    stockMarketData.high = 1000000;
    stockMarketData.open = 900000;
    stockMarketData.low = 800000;
    stockMarketData.close = 950000;
    stockMarketData.adjclose = 950000;
    stockMarketData.volume = 1000000;
    // 3. 해당 회사 정보는 걍 위에서 갖다 쓴다. 위처럼 객체가 미리 존재하지 않을 경우에는 불러 와야 한다.
    stockMarketData.company = company;
    // 4. 구성한 시장 기록을 저장한다.
    await stockMarketDataRepository.save(stockMarketData);
  })
  .catch((error) => console.log(error));
