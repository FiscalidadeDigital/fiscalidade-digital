import { ServiceUnavailableException } from '@nestjs/common';
import { AgtEnvironment, SoftwareInfoDetail } from './electronic-invoicing.types';

const BASE_URLS: Record<AgtEnvironment, string> = {
  homologation: 'https://sifphml.minfin.gov.ao/sigt/fe/v1',
  production: 'https://sifp.minfin.gov.ao/sigt/fe/v1',
};

export type AgtEinvoiceConfig = {
  environment: AgtEnvironment;
  baseUrl: string;
  username: string;
  password: string;
  privateKey: string;
  software: SoftwareInfoDetail;
  timeoutMs: number;
};

export function readAgtEinvoiceConfig(): AgtEinvoiceConfig | null {
  const environment = process.env.AGT_EINVOICE_ENVIRONMENT?.trim() as AgtEnvironment;
  const signatureVersion = Number(process.env.AGT_EINVOICE_SIGNATURE_VERSION);
  const config = {
    environment,
    username: process.env.AGT_EINVOICE_USERNAME?.trim() ?? '',
    password: process.env.AGT_EINVOICE_PASSWORD ?? '',
    privateKey: process.env.AGT_EINVOICE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim() ?? '',
    software: {
      productId: process.env.AGT_EINVOICE_PRODUCT_ID?.trim() ?? '',
      productVersion: process.env.AGT_EINVOICE_PRODUCT_VERSION?.trim() ?? '',
      softwareValidationNumber: process.env.AGT_EINVOICE_SOFTWARE_VALIDATION_NUMBER?.trim() ?? '',
      signatureVersion,
    },
    timeoutMs: Number(process.env.AGT_EINVOICE_TIMEOUT_MS ?? 15000),
  };
  if (!['homologation', 'production'].includes(environment)) return null;
  if (!config.username || !config.password || !config.privateKey || !config.software.productId ||
      !config.software.productVersion || !config.software.softwareValidationNumber ||
      !Number.isInteger(signatureVersion) || signatureVersion < 1) return null;
  return { ...config, baseUrl: BASE_URLS[environment] };
}

export function requireAgtEinvoiceConfig() {
  const config = readAgtEinvoiceConfig();
  if (!config) throw new ServiceUnavailableException({
    code: 'AGT_CONFIGURATION_PENDING',
    message: 'Configuração oficial AGT pendente.',
  });
  return config;
}
