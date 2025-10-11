-- AlterTable
ALTER TABLE `Contract` ADD COLUMN `clientFeedback` TEXT NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `submissionData` TEXT NULL,
    ADD COLUMN `submissionDescription` TEXT NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'FREELANCER_ACCEPTED', 'CLIENT_ACCEPTED', 'ACTIVE', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ALTER COLUMN `startDate` DROP DEFAULT,
    MODIFY `terms` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NOT NULL,

    INDEX `Ticket_contractId_idx`(`contractId`),
    INDEX `Ticket_createdById_idx`(`createdById`),
    INDEX `Ticket_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
