/*
  Warnings:

  - You are about to drop the column `resourceId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `cpuUsage` on the `SystemMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `diskUsage` on the `SystemMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsage` on the `SystemMetrics` table. All the data in the column will be lost.
  - Added the required column `entityId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `changes` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `metricType` to the `SystemMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `SystemMetrics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `AuditLog_action_idx` ON `AuditLog`;

-- DropIndex
DROP INDEX `AuditLog_resourceType_resourceId_idx` ON `AuditLog`;

-- DropIndex
DROP INDEX `AuditLog_status_idx` ON `AuditLog`;

-- AlterTable
ALTER TABLE `AuditLog` DROP COLUMN `resourceId`,
    DROP COLUMN `resourceType`,
    DROP COLUMN `status`,
    ADD COLUMN `entityId` VARCHAR(191) NOT NULL,
    ADD COLUMN `entityType` VARCHAR(191) NOT NULL,
    ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `userAgent` VARCHAR(191) NULL,
    MODIFY `changes` JSON NOT NULL;

-- AlterTable
ALTER TABLE `SystemMetrics` DROP COLUMN `cpuUsage`,
    DROP COLUMN `diskUsage`,
    DROP COLUMN `memoryUsage`,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `metricType` VARCHAR(191) NOT NULL,
    ADD COLUMN `value` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `Analytics` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventData` JSON NOT NULL,
    `userId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `Analytics_userId_idx`(`userId`),
    INDEX `Analytics_eventType_idx`(`eventType`),
    INDEX `Analytics_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileStorage` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NULL,

    INDEX `FileStorage_userId_idx`(`userId`),
    INDEX `FileStorage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Webhook` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `events` JSON NOT NULL,
    `secret` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastTriggeredAt` DATETIME(3) NULL,
    `metadata` JSON NULL,

    INDEX `Webhook_userId_idx`(`userId`),
    INDEX `Webhook_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `webhookId` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` INTEGER NOT NULL,
    `response` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookLog_webhookId_idx`(`webhookId`),
    INDEX `WebhookLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_entityType_idx` ON `AuditLog`(`entityType`);

-- CreateIndex
CREATE INDEX `SystemMetrics_metricType_idx` ON `SystemMetrics`(`metricType`);

-- AddForeignKey
ALTER TABLE `Analytics` ADD CONSTRAINT `Analytics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileStorage` ADD CONSTRAINT `FileStorage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Webhook` ADD CONSTRAINT `Webhook_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookLog` ADD CONSTRAINT `WebhookLog_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `Webhook`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
