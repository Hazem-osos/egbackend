-- AlterTable
ALTER TABLE `Connect` ADD COLUMN `maxPurchase` INTEGER NULL,
    ADD COLUMN `minPurchase` INTEGER NULL,
    ADD COLUMN `validityDays` INTEGER NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Credit` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `sourceId` VARCHAR(191) NULL,
    ADD COLUMN `sourceType` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `IdVerification` ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `verificationMethod` VARCHAR(191) NULL,
    ADD COLUMN `verifiedBy` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Credit_sourceId_idx` ON `Credit`(`sourceId`);

-- CreateIndex
CREATE INDEX `IdVerification_verifiedBy_idx` ON `IdVerification`(`verifiedBy`);
