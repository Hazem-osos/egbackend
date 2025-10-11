-- AlterTable
ALTER TABLE `Job` ADD COLUMN `duration` VARCHAR(191) NOT NULL DEFAULT '1_to_3_months',
    ADD COLUMN `experience` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
    ADD COLUMN `jobType` VARCHAR(191) NOT NULL DEFAULT 'fixed',
    ADD COLUMN `location` VARCHAR(191) NOT NULL DEFAULT 'remote';
