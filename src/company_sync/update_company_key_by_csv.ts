import * as fs from 'fs';
import { AppDataSource } from '../data_source';
import { Company } from '../entities/company';

// CSV 파일 경로
const filePath = './company_with_industry.csv';

interface UpdateEl {
  id: number;
  industry_key: string;
  sector_key: string;
}

async function main() {
  await AppDataSource.initialize();
  // CSV 파일 읽기
  // 컬럼 구성이 symbol,name,id,industry_key,sector_key 형태여야 함.
  const raw_csv = fs.readFileSync(filePath, 'utf8');
  const splitByLine = raw_csv.split('\n');
  const headers = splitByLine[0].split(',');
  const headerIndexMap = headers.reduce((acc, cur, i) => {
    acc[cur] = i;
    return acc;
  }, {});
  console.log(headerIndexMap);
  // CSV 파일을 배열로 변환
  const csvWithoutHeader = splitByLine.splice(1).map((line, i) => {
    const simpleSplitList = line.split(',');

    // 문자열에 쉽표가 들어가서 제대로 분리되지 않는 경우를 위한 처리
    while (
      simpleSplitList.find((el) => el.startsWith('"') && !el.endsWith('"'))
    ) {
      const targetIdx = simpleSplitList.findIndex((el) => el.startsWith('"'));
      simpleSplitList[targetIdx] =
        simpleSplitList[targetIdx] + ',' + simpleSplitList[targetIdx + 1];
      simpleSplitList.splice(targetIdx + 1, 1);
    }
    // 캐리지 리턴 문자 제거
    simpleSplitList[simpleSplitList.length - 1] = simpleSplitList[
      simpleSplitList.length - 1
    ].replace('\r', '');
    return simpleSplitList;
  }).filter((el) => el.length === headers.length);
  const allCount = csvWithoutHeader.length;
  let notNullCount = 0;


  // 헤더 제외하고 반복문 돌리기
  for (let i = 0; i < csvWithoutHeader.length; i++ ) {
    const targetRow = csvWithoutHeader[i];
    const symbol: string | undefined = targetRow[headerIndexMap['symbol']];
    const name: string | undefined = targetRow[headerIndexMap['name']];
    const id: string | undefined = targetRow[headerIndexMap['id']];
    const industry_key: string | undefined =
      targetRow[headerIndexMap['industry_key']];
    const sector_key: string | undefined =
      targetRow[headerIndexMap['sector_key']];
    if (symbol === undefined || id === undefined) {
      console.log(`#${i}. required values is missing(symbol, id)`);
      return;
    }

    if (industry_key === '' || sector_key === '') {
      continue;
    }
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      console.log(`#${i}. id is Nan`);
      return;
    }
    process.stdout.clearLine(0); // Clears the current line
    process.stdout.write(
      `Updating ${name}(${symbol})... `.padEnd(100, ' ') +
        `${((i / allCount) * 100).toFixed(2)}%\r`,
    );
    const repo = AppDataSource.getRepository(Company);
    const updatedCompany = new Company();
    updatedCompany.industryKey = industry_key;
    updatedCompany.sectorKey = sector_key;
    await repo.update({ id: parseInt(id) }, updatedCompany);
    notNullCount++;
  }
  process.stdout.clearLine(0);
  process.stdout.write(`Updating... Done`.padEnd(100, ' ') + `100%\r`);
  console.log('\n');
  console.log('Done ------------------------------------');
  console.log(`전체 데이터 : ${allCount}`);
  console.log(`산업 정보가 null이 아닌 데이터 : ${notNullCount}`);
  console.log('Done ------------------------------------');
}

main();
