import axios from 'axios';
import { AppDataSource } from './data_source';
import { Company } from './entities/company';
import { StockMarketData } from './entities/stock_market_data';
import 'reflect-metadata';
import 'dotenv/config';

const interestingExchanges = ['NASDAQ', 'NYSE', 'AMEX', 'KSC', 'KOE'];

AppDataSource.initialize()
  .then(async () => {
    // FMP 회사의 무료 플랜 내에서 거래 가능한 회사 목록을 전부 가져온다.
    const url = `https://financialmodelingprep.com/api/v3/available-traded/list?apikey=${process.env.FMP_API_KEY}`;
    try {
      const response = await axios.get(url);
      const interestingStocks = response.data.filter((stock: any) =>
        interestingExchanges.includes(stock.exchangeShortName),
      );
      const companyRepository = AppDataSource.manager.getRepository(Company);
      const companyEntites = interestingStocks.map((stock: any) => {
        const company = new Company();
        company.name = stock.name ?? '';
        company.symbol = stock.symbol ?? '';
        company.exchangeShortName = stock.exchangeShortName;
        return company;
      });
      await companyRepository.save(companyEntites);
    } catch (err) {
      console.error('Error fetching all symbols:', err);
    }
  })
  .catch((error) => console.log(error));
