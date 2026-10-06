import { readFileSync } from 'node:fs';
import { XmlDocument, XsdValidator } from 'libxml2-wasm';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const xml = Buffer.concat(chunks).toString('utf8');
let schema;
let document;
let validator;
try {
  schema = XmlDocument.fromString(readFileSync(process.argv[2], 'utf8'));
  document = XmlDocument.fromString(xml);
  validator = XsdValidator.fromDoc(schema);
  validator.validate(document);
  process.stdout.write(JSON.stringify({ valid: true, errors: [] }));
} catch (error) {
  const details = Array.isArray(error?.details)
    ? error.details.map((item) => `${item.line ?? 0}:${item.col ?? 0} ${String(item.message ?? 'Erro XSD')}`)
    : [String(error?.message ?? error)];
  process.stdout.write(JSON.stringify({ valid: false, errors: details }));
} finally {
  validator?.dispose();
  document?.dispose();
  schema?.dispose();
}
