/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `receiverCpf` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderCpf` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_senderId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "receiverCpf" TEXT NOT NULL,
ADD COLUMN     "senderCpf" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderCpf_fkey" FOREIGN KEY ("senderCpf") REFERENCES "User"("cpf") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverCpf_fkey" FOREIGN KEY ("receiverCpf") REFERENCES "User"("cpf") ON DELETE RESTRICT ON UPDATE CASCADE;
