import * as fs from "fs";
import { AppDataSource } from '../data_source';
import { Company } from "../entities/company";


// CSV 파일 경로
const filePath = "./company_with_industry.csv";


interface UpdateEl {
  id : number;
  industry_key : string;
  sector_key : string;
}

async function main() {
  await AppDataSource.initialize();
  // CSV 파일 읽기
  const raw_csv = fs.readFileSync(filePath, "utf8");

  // CSV 파일을 배열로 변환
  const csv = raw_csv.split("\n").map((line) => {
    const simpleSplitList = line.split(",");
    // 문자열에 쉽표가 들어가서 제대로 분리되지 않는 경우를 위한 처리
    while (simpleSplitList.find((el) => el.startsWith('"') && !el.endsWith('"'))) {
      const targetIdx = simpleSplitList.findIndex((el) => el.startsWith('"'));
      simpleSplitList[targetIdx] = simpleSplitList[targetIdx] + "," + simpleSplitList[targetIdx + 1];
      simpleSplitList.splice(targetIdx + 1, 1);
    }
    // 캐리지 리턴 제거
    simpleSplitList[simpleSplitList.length - 1] = simpleSplitList[simpleSplitList.length - 1].replace("\r", "");
    return simpleSplitList
  });
  let allCount = 0;
  let notNullCount = 0;
  for (let csv_line of csv) {
    allCount += 1;
    const [i, symbol, name, id, industry_key, sector_key] = csv_line;
    if (industry_key !== '' && sector_key !== '') {
      notNullCount += 1;
    }
  }
  console.log(`전체 데이터 : ${allCount}`);
  console.log(`null이 아닌 데이터 : ${notNullCount}`);

  for (let csv_line of csv) {
    // header 생략
    if (csv_line[0] === "") {
      continue;
    }
    const [i, symbol, name, id, industry_key, sector_key] = csv_line;
    if (industry_key === '' || sector_key === '') {
      continue
    }
    
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      console.log(`${i}. id is not a number: ${id}`);

    }
    const repo = AppDataSource.getRepository(Company);
    process.stdout.clearLine(0); // Clears the current line
    process.stdout.write(`Updating ${name}(${symbol})... ${(parseInt(i)/allCount * 100).toFixed(2)}%\r`);
    const updatedCompany = new Company()
    updatedCompany.industryKey = industry_key;
    updatedCompany.sectorKey = sector_key;
    await repo.update({id: parseInt(id)}, updatedCompany);
  }
  console.log("Done");
}

main();