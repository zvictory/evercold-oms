-- AlterTable
ALTER TABLE `Order` ADD COLUMN `agreementNumber` VARCHAR(191) NULL,
    ADD COLUMN `agreementDate` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Order_invoiceNumber_idx` ON `Order`(`invoiceNumber`);
