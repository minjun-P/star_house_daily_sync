import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnInCompany1741589794613 implements MigrationInterface {
    name = 'AddColumnInCompany1741589794613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" ADD "industry_key" character varying`);
        await queryRunner.query(`ALTER TABLE "company" ADD "sector_key" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "sector_key"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "industry_key"`);
    }

}
