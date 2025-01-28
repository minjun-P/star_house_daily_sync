import { AppDataSource } from "./data_source";
import { Company } from "./entities/company";
import { StockMarketData } from "./entities/stock_market_data";
import { In } from "typeorm";

const TASK_COUNT = 300;
const FAIL_TASK_INDICES = [3,8,38, 56,75,79, 94,105, 106, 107, 109, 113, 133, 137,142, 154,261  ];


AppDataSource.initialize().then(async () => {
  const companyRepo = AppDataSource.getRepository(Company);
  const companies = await companyRepo.find({
    select: ['id'],
  });

  const failCompanyIds = companies.filter((company) => {
    return FAIL_TASK_INDICES.includes(company.id % TASK_COUNT);
  }).map((company) => company.id);

  console.log('Fail Company Ids', failCompanyIds);

  const marketRepo = AppDataSource.getRepository(StockMarketData);
  await marketRepo.delete({
    company: {
      id: In(failCompanyIds),
    },
  });
});