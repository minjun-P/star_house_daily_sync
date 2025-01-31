import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1738336044826 implements MigrationInterface {
    name = 'Migrations1738336044826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_market_data" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "stock_market_data" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_c7f9b5e3457bb2149241609bf3b" UNIQUE ("symbol")`);
        await queryRunner.query(`ALTER TABLE "stock_market_data" ADD CONSTRAINT "UQ_57f8697f376bb2fdc5aa76fd5a2" UNIQUE ("company_id", "date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_market_data" DROP CONSTRAINT "UQ_57f8697f376bb2fdc5aa76fd5a2"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_c7f9b5e3457bb2149241609bf3b"`);
        await queryRunner.query(`ALTER TABLE "stock_market_data" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "stock_market_data" DROP COLUMN "created_at"`);
    }

}
