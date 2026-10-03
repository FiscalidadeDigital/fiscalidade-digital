export type FiscalSignaturePayload = {
  invoiceDate: Date;
  systemEntryDate: Date;
  invoiceNo: string;
  grossTotal: string;
  previousHash?: string | null;
};

export type FiscalSignatureResult = {
  hash: string;
  hashControl: string;
  keyVersion: number;
  canonicalText: string;
};

export type FiscalSignatureConfiguration = {
  configured: boolean;
  blocker?: {
    code: 'FISCAL_SIGNATURE_NOT_CONFIGURED';
    message: string;
  };
};

export interface FiscalSignatureProvider {
  configuration(): FiscalSignatureConfiguration;
  sign(payload: FiscalSignaturePayload): FiscalSignatureResult;
  verify(payload: FiscalSignaturePayload, hash: string, publicKey: string): boolean;
}
