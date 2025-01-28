import axios from 'axios';
import { AppDataSource } from '../data_source';
import { Company } from '../entities/company';
import 'reflect-metadata';
import 'dotenv/config';
import { EXCHANGE_NATION_MAP, InterestingExchange } from 'core';

AppDataSource.initialize()
  .then(async () => {
    const allInterestingExchagnes: InterestingExchange[] = Object.values(
      EXCHANGE_NATION_MAP,
    ).reduce((acc, exchanges) => acc.concat(exchanges), []);
    // FMP 회사의 무료 플랜 내에서 거래 가능한 회사 목록을 전부 가져온다.
    const url = `https://financialmodelingprep.com/api/v3/available-traded/list?apikey=${process.env.FMP_API_KEY}`;
    const response = await axios.get(url);
    const interestingStocks = response.data.filter((stock: any) =>
      allInterestingExchagnes.includes(stock.exchangeShortName),
    );
    const companyRepository = AppDataSource.manager.getRepository(Company);
    const companyEntites = interestingStocks.map((stock: any) => {
      const company = new Company();
      company.name = stock.name ?? '';
      company.symbol = stock.symbol ?? '';
      company.exchangeShortName = stock.exchangeShortName;
      Object.entries(EXCHANGE_NATION_MAP).forEach(([nation, exchanges]) => {
        if (exchanges.includes(stock.exchangeShortName)) {
          company.nation = nation;
        }
      });
      return company;
    });
    await companyRepository.save(companyEntites);
  })
  .catch((error) => console.log(error));
