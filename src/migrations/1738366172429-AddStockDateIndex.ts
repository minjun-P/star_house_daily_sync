import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockDateIndex1738366172429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX idx_stock_market_data_company_date ON stock_market_data (company_id, date DESC);
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX idx_stock_market_data_company_date;
            `);
  }
}
