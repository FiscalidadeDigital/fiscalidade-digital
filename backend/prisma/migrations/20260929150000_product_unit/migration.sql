-- Unidade comercial explícita para produtos e serviços existentes.
-- O valor UN preserva os registos anteriores e pode ser alterado pela empresa.
ALTER TABLE "Product"
ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'UN';
