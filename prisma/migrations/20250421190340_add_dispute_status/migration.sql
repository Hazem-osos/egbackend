/*
  Warnings:

  - You are about to drop the column `teamId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Job` DROP FOREIGN KEY `Job_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `Team` DROP FOREIGN KEY `Team_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `TeamMember` DROP FOREIGN KEY `TeamMember_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `TeamMember` DROP FOREIGN KEY `TeamMember_userId_fkey`;

-- DropIndex
DROP INDEX `Job_teamId_idx` ON `Job`;

-- AlterTable
ALTER TABLE `Job` DROP COLUMN `teamId`;

-- DropTable
DROP TABLE `Team`;

-- DropTable
DROP TABLE `TeamMember`;
