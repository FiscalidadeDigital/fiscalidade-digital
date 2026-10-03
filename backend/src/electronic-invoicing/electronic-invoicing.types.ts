export const AGT_EINVOICE_SCHEMA_VERSION = '2.0';
export type AgtEnvironment = 'homologation' | 'production';
export type SubmissionStatus = 'READY' | 'SUBMITTING' | 'SUBMITTED' | 'PROCESSING' | 'VALID' | 'INVALID' | 'REJECTED' | 'ERROR';

export interface SoftwareInfoDetail {
  productId: string;
  productVersion: string;
  softwareValidationNumber: string;
  signatureVersion: number;
}

export interface AgtError { idError?: string; descriptionError?: string; documentNo?: string }
export interface AgtRegisterResponse { requestID?: string; errorList?: AgtError[] }
export interface AgtDocumentStatus { documentNo?: string; documentStatus?: 'V' | 'I'; errorList?: AgtError[] }
export interface AgtStatusResponse { requestID?: string; resultCode?: number; validationStatus?: string; documentStatusList?: AgtDocumentStatus[]; errorList?: AgtError[] }
export interface AgtInvoiceResponse { documentNo?: string; validationStatus?: 'V' | 'P'; documents?: unknown[]; errorList?: AgtError[] }
export interface AgtSeriesResponse { resultCode?: number; errorList?: AgtError[]; seriesFEResult?: { seriesCode?: string; authorizedQuantity?: number | string; firstDocumentNo?: string; lastDocumentNo?: string } }

export type PreflightIssue = {
  code: string;
  category: 'TECHNICAL' | 'DATA' | 'CONFIGURATION' | 'OFFICIAL_DEPENDENCY';
  message: string;
};
