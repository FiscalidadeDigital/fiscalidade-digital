import * as path from 'path';

export function getDocumentStorageDirectory(): string {
  const configuredDirectory = process.env.DOCUMENT_STORAGE_DIR?.trim();
  if (configuredDirectory) {
    return path.resolve(configuredDirectory);
  }

  return path.resolve(__dirname, '../../uploads/documents');
}
