/*
  Warnings:

  - You are about to alter the column `submissionData` on the `Contract` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- First, create a temporary column with JSON type
ALTER TABLE `Contract` ADD COLUMN `submissionData_new` JSON;

-- Update the temporary column with default JSON structure for existing data
UPDATE `Contract` SET `submissionData_new` = JSON_OBJECT('description', '', 'fileUrl', '') WHERE `submissionData` IS NOT NULL;

-- Drop the old column
ALTER TABLE `Contract` DROP COLUMN `submissionData`;

-- Rename the new column to the original name
ALTER TABLE `Contract` CHANGE `submissionData_new` `submissionData` JSON;
