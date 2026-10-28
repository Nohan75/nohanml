import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1793221933062 implements MigrationInterface {
  name = 'Init1793221933062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "skills" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" character varying(100) NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" SERIAL NOT NULL, "title" character varying(150) NOT NULL, "description" text NOT NULL, "stack" text array NOT NULL DEFAULT '{}', "githubUrl" character varying, "liveUrl" character varying, "imageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profile" ("id" SERIAL NOT NULL, "heroTitle" character varying(150) NOT NULL, "heroSubtitle" text NOT NULL, "bio" text NOT NULL, "email" character varying(150) NOT NULL, "location" character varying(150) NOT NULL, "available" boolean NOT NULL DEFAULT true, "cvUrl" character varying, "linkedinUrl" character varying, "githubUrl" character varying, CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "experiences" ("id" SERIAL NOT NULL, "title" character varying(150) NOT NULL, "company" character varying(150) NOT NULL, "location" character varying, "startDate" character varying NOT NULL, "endDate" character varying, "description" text NOT NULL, "thumbnailUrl" character varying, "photos" text array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_884f0913a63882712ea578e7c85" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "experiences"`);
    await queryRunner.query(`DROP TABLE "profile"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "skills"`);
  }
}
