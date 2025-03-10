import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StockMarketData } from './stock_market_data';

@Entity()
@Unique(['symbol'])
export class Company {
  @PrimaryGeneratedColumn()
  id: number;
  // 상장 회사 이름
  @Column()
  name: string;
  // 상장 회사 주식 코드
  @Column()
  symbol: string;
  @Column()
  exchangeShortName: string;
  @Column()
  nation: string;
  @Column({ nullable: true })
  industryKey?: string;
  @Column({ nullable: true })
  sectorKey?: string;

  // 참조 -> 어느 회사의 거래 데이터인지
  @OneToMany(
    () => StockMarketData,
    (stockMarketData) => stockMarketData.company,
  )
  stockMarketData: StockMarketData[];
}
