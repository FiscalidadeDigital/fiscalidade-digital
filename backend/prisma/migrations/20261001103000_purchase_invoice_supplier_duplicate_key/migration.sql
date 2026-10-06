DROP INDEX "PurchaseInvoice_tenantId_invoiceNumber_key";

CREATE UNIQUE INDEX "PurchaseInvoice_tenantId_supplierId_invoiceNumber_key"
  ON "PurchaseInvoice"("tenantId", "supplierId", "invoiceNumber");
