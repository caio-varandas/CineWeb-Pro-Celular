-- AlterTable: User - rename "updateAt" -> "updatedAt" e adiciona campos de recuperação de senha
ALTER TABLE "User" RENAME COLUMN "updateAt" TO "updatedAt";

ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpires" TIMESTAMP(3);
