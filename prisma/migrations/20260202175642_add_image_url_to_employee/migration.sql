/*
  Warnings:

  - You are about to drop the column `avatar_url` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "avatar_url",
ADD COLUMN     "image_url" TEXT;
