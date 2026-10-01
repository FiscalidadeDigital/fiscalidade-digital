-- Revisão humana do IVA suportado. A importação/OCR nunca altera este estado.
ALTER TABLE "PurchaseInvoice"
  ADD COLUMN "vatDeductibilityStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  ADD COLUMN "vatDeductibilityReason" TEXT,
  ADD COLUMN "vatReviewedAt" TIMESTAMP(3),
  ADD COLUMN "vatReviewedById" TEXT;
