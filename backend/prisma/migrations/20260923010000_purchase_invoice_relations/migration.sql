-- Enforce the supplier and parent invoice relationships that were previously
-- represented only by scalar IDs in the Prisma schema.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PurchaseInvoice_supplierId_fkey'
    ) THEN
        ALTER TABLE "PurchaseInvoice"
        ADD CONSTRAINT "PurchaseInvoice_supplierId_fkey"
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PurchaseInvoiceItem_purchaseInvoiceId_fkey'
    ) THEN
        ALTER TABLE "PurchaseInvoiceItem"
        ADD CONSTRAINT "PurchaseInvoiceItem_purchaseInvoiceId_fkey"
        FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
