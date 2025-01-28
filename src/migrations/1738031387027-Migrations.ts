import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1738031387027 implements MigrationInterface {
  name = 'Migrations1738031387027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. 기존 nation 컬럼이 존재하는 경우 삭제
    await queryRunner.query(`
        ALTER TABLE "company" DROP COLUMN IF EXISTS "nation"
      `);
    // 1. 컬럼 추가 (NULL 허용)
    await queryRunner.query(`
        ALTER TABLE "company" ADD "nation" character varying
      `);

    // 2. 기존 데이터를 업데이트
    await queryRunner.query(`
        UPDATE "company"
        SET "nation" = CASE
          WHEN "exchange_short_name" IN ('KSC', 'KOE') THEN 'KR'
          ELSE 'US'
        END
      `);

    // 3. NOT NULL 제약 조건 추가
    await queryRunner.query(`
        ALTER TABLE "company" ALTER COLUMN "nation" SET NOT NULL
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "nation"`);
    await queryRunner.query(
      `ALTER TABLE "company" ADD "nation" character varying(256) NOT NULL`,
    );
  }
}
