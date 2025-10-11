/*
  Warnings:

  - Added the required column `cloudinaryUrl` to the `FileStorage` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the column as nullable
ALTER TABLE `FileStorage` ADD COLUMN `cloudinaryUrl` VARCHAR(191) NULL;

-- Update existing records to use the path as the cloudinaryUrl
UPDATE `FileStorage` SET `cloudinaryUrl` = CONCAT('https://res.cloudinary.com/de1mpufjm/raw/upload/', `path`) WHERE `cloudinaryUrl` IS NULL;

-- Make the column required
ALTER TABLE `FileStorage` MODIFY COLUMN `cloudinaryUrl` VARCHAR(191) NOT NULL;
