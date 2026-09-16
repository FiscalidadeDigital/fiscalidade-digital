-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('FACTURA', 'RECIBO', 'DECLARACAO', 'PAGAMENTO', 'CONTRATO', 'EMPRESA', 'COMPROVATIVO', 'RELATORIO', 'OUTROS');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OUTROS',
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_invoiceId_idx" ON "Document"("invoiceId");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
