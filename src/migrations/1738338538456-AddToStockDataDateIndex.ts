import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddToStockDataDateIndex1738338538456
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX idx_stock_market_data_date_desc 
            ON stock_market_data (date DESC);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX idx_stock_market_data_date_desc;
        `);
  }
}
