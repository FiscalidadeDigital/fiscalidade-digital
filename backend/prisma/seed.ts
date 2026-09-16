import { PrismaClient, TaxType, ObligationType, FiscalRegime } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, "data");

const MONTHS = [
  { number: 1, name: "Janeiro" },
  { number: 2, name: "Fevereiro" },
  { number: 3, name: "Março" },
  { number: 4, name: "Abril" },
  { number: 5, name: "Maio" },
  { number: 6, name: "Junho" },
  { number: 7, name: "Julho" },
  { number: 8, name: "Agosto" },
  { number: 9, name: "Setembro" },
  { number: 10, name: "Outubro" },
  { number: 11, name: "Novembro" },
  { number: 12, name: "Dezembro" },
];

const TAX_MAP: Record<string, TaxType> = {
  IVA: TaxType.IVA,
  IEC: TaxType.IEC,
  II: TaxType.II,
  IAC: TaxType.IAC,
  IRT: TaxType.IRT,
  IP: TaxType.IP,
  IVM: TaxType.IVM,
  IEJ: TaxType.IEJ,
  IS: TaxType.IS,
  CEOC: TaxType.CEOC,
  IRP: TaxType.IRP,
  RCN: TaxType.RCN,
  TS: TaxType.TS,
  CFQA: TaxType.CFQA,
  ITP: TaxType.ITP,
  IPP: TaxType.IPP,
  IVRM: TaxType.IVRM,
  INDUSTRIAL: TaxType.INDUSTRIAL,
  SELO: TaxType.SELO,
  SS: TaxType.SS,
  TAXA_GAS: TaxType.TAXA_GAS,
};

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTax(value: unknown): string {
  return clean(value)
    .toUpperCase()
    .replace(/[.,]/g, "")
    .trim();
}

function getTaxType(value: unknown): TaxType {
  const normalized = normalizeTax(value);

  if (normalized.includes("IRP") && normalized.includes("IPP")) {
    return TaxType.IRP;
  }

  const first = normalized.split(/[,\s/]+/)[0];

  if (TAX_MAP[first]) {
    return TAX_MAP[first];
  }

  if (normalized.includes("IVA")) return TaxType.IVA;
  if (normalized.includes("IEC")) return TaxType.IEC;
  if (normalized.includes("IRT")) return TaxType.IRT;
  if (normalized.includes("IAC")) return TaxType.IAC;
  if (normalized.includes("IVM")) return TaxType.IVM;
  if (normalized.includes("IEJ")) return TaxType.IEJ;
  if (normalized.includes("CEOC")) return TaxType.CEOC;
  if (normalized.includes("IVRM")) return TaxType.IVRM;
  if (normalized.includes("IRP")) return TaxType.IRP;
  if (normalized.includes("RCN")) return TaxType.RCN;
  if (normalized.includes("TS")) return TaxType.TS;
  if (normalized.includes("CFQA")) return TaxType.CFQA;
  if (normalized.includes("ITP")) return TaxType.ITP;
  if (normalized.includes("IPP")) return TaxType.IPP;
  if (normalized.includes("IP")) return TaxType.IP;
  if (normalized.includes("IS")) return TaxType.IS;
  if (normalized.includes("II")) return TaxType.II;

  return TaxType.INDUSTRIAL;
}

function getObligationType(
  designation: string,
  tax: string,
): ObligationType {
  const text = `${tax} ${designation}`.toUpperCase();

  if (
    text.includes("PAGAMENTO") ||
    text.includes("LIQUIDAÇÃO E PAGAMENTO") ||
    text.includes("PAGAMENTO DO IMPOSTO")
  ) {
    if ((ObligationType as any).PAGAMENTO) {
      return (ObligationType as any).PAGAMENTO;
    }
  }

  if (
    text.includes("RETENÇÃO") ||
    text.includes("RETIDO NA FONTE")
  ) {
    if ((ObligationType as any).RETENCAO) {
      return (ObligationType as any).RETENCAO;
    }
  }

  if (text.includes("SAF-T") || text.includes("SAFT")) {
    if ((ObligationType as any).SAF_T) {
      return (ObligationType as any).SAF_T;
    }
  }

  if (
    text.includes("COMUNICAÇÃO") ||
    text.includes("COMUNICACAO")
  ) {
    if ((ObligationType as any).COMUNICACAO) {
      return (ObligationType as any).COMUNICACAO;
    }
  }

  if ((ObligationType as any).DECLARACAO) {
    return (ObligationType as any).DECLARACAO;
  }

  return Object.values(ObligationType)[0];
}

function parseDay(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = clean(value);

  if (!text) {
    return null;
  }

  // Exemplos: "31", "2 de Fev", "3 de Nov"
  const match = text.match(/^(\d{1,2})/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);

  if (day < 1 || day > 31) {
    return null;
  }

  return day;
}

function parseDueDate(
  value: unknown,
  year: number,
  month: number,
): Date | null {
  const day = parseDay(value);

  if (!day) {
    return null;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59),
  );

  // Evita datas inválidas como 31 de Fevereiro
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function detectYear(workbook: XLSX.WorkBook): number {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: null,
      raw: false,
    });

    for (const row of rows.slice(0, 15)) {
      for (const cell of row) {
        const text = clean(cell);
        const match = text.match(/20\d{2}/);

        if (match) {
          return Number(match[0]);
        }
      }
    }
  }

  return new Date().getFullYear();
}

function detectRegimes(
  sheetName: string,
  designation: string,
): FiscalRegime[] {
  const sheet = sheetName
    .trim()
    .toUpperCase();

  const text = designation
    .trim()
    .toUpperCase();

  /*
   * =====================================================
   * FOLHA REGIME GERAL
   * =====================================================
   *
   * A folha "Regime Geral" pode conter obrigações
   * destinadas ao Regime Geral, ao Regime Simplificado
   * ou aos dois.
   *
   * Por isso o regime é determinado pela designação
   * da obrigação e não apenas pelo nome da folha.
   */

  if (sheet.includes("REGIME GERAL")) {
    const hasSimplified =
      text.includes("REGIME SIMPLIFICADO");

    const hasGeneral =
      text.includes("REGIME GERAL");

    const hasBoth =
      text.includes("GERAL E SIMPLIFICADO") ||
      text.includes("SIMPLIFICADO E GERAL");

    /*
     * Obrigação explicitamente aplicável aos dois regimes.
     */
    if (hasBoth) {
      return [
        FiscalRegime.GERAL,
        FiscalRegime.SIMPLIFICADO,
      ];
    }

    /*
     * Obrigação explicitamente do Simplificado.
     */
    if (hasSimplified && !hasGeneral) {
      return [
        FiscalRegime.SIMPLIFICADO,
      ];
    }

    /*
     * Obrigação explicitamente do Geral.
     */
    if (hasGeneral && !hasSimplified) {
      return [
        FiscalRegime.GERAL,
      ];
    }

    /*
     * Quando a descrição não identifica
     * explicitamente o regime, mantém-se GERAL
     * como comportamento padrão do calendário.
     */
    return [
      FiscalRegime.GERAL,
    ];
  }

  /*
   * =====================================================
   * FOLHA REGIME ESPECIAL
   * =====================================================
   *
   * O enum atual do Prisma não possui um regime
   * específico para "REGIME ESPECIAL".
   *
   * Não vamos transformar artificialmente Especial
   * em Simplificado.
   *
   * Mantemos GERAL temporariamente até existir no
   * modelo um regime específico para Especial.
   */

  if (sheet.includes("REGIME ESPECIAL")) {
    return [
      FiscalRegime.GERAL,
    ];
  }

  return [
    FiscalRegime.GERAL,
  ];
}

async function importWorkbook(
  fileName: string,
): Promise<{ inserted: number; skipped: number }> {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️ Ficheiro não encontrado: ${filePath}`);
    return { inserted: 0, skipped: 0 };
  }

  console.log(`\n========================================`);
  console.log(`LENDO: ${fileName}`);
  console.log(`========================================`);

  const workbook = XLSX.readFile(filePath);
  const year = detectYear(workbook);

  console.log(`Ano detectado: ${year}`);
  console.log(`Folhas: ${workbook.SheetNames.join(", ")}`);

  let inserted = 0;
  let skipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: null,
      raw: false,
    });

    let headerRow = -1;

    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const row = rows[i] ?? [];

      const values = row.map(clean);

      if (
        values.some((v) => v.toUpperCase() === "SECTOR") &&
        values.some((v) => v.toUpperCase().includes("IMPOSTO")) &&
        values.some((v) => v.toUpperCase().includes("DESIGNAÇÃO"))
      ) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === -1) {
      console.log(`⚠️ Cabeçalho não encontrado na folha ${sheetName}`);
      continue;
    }

    console.log(`\nFolha: ${sheetName}`);
    console.log(`Cabeçalho: linha ${headerRow + 1}`);

    const dataRows = rows.slice(headerRow + 2);

    for (const row of dataRows) {
      const sector = clean(row[1]);
      const taxRaw = clean(row[2]);
      const designation = clean(row[3]);

      if (!taxRaw || !designation) {
        continue;
      }

      const taxType = getTaxType(taxRaw);
      const obligationType = getObligationType(
        designation,
        taxRaw,
      );

      const regimes = detectRegimes(
        sheetName,
        designation,
      );

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const rawDate = row[4 + monthIndex];

        if (
          rawDate === null ||
          rawDate === undefined ||
          clean(rawDate) === ""
        ) {
          continue;
        }

        const dueDate = parseDueDate(
          rawDate,
          year,
          monthIndex + 1,
        );

        if (!dueDate) {
          skipped++;

          console.log(
            `⚠️ Prazo não convertido: ${taxRaw} | ${designation.substring(
              0,
              70,
            )} | ${MONTHS[monthIndex].name}: ${clean(rawDate)}`,
          );

          continue;
        }

        const monthName = MONTHS[monthIndex].name;

        const code = [
          year,
          sheetName.replace(/\s+/g, "-").toUpperCase(),
          normalizeTax(taxRaw).replace(/\s+/g, "-"),
          monthIndex + 1,
          Math.abs(
            designation
              .split("")
              .reduce(
                (acc, char) =>
                  (acc * 31 + char.charCodeAt(0)) >>> 0,
                7,
              ),
          ),
        ].join("-");

        const title = `${taxRaw} — ${designation}`;

        const description = [
          `Sector: ${sector || "N/A"}`,
          `Regime: ${sheetName}`,
          `Mês de referência do prazo: ${monthName}`,
          `Prazo indicado no Calendário Fiscal AGT: ${clean(rawDate)}`,
          `Ano: ${year}`,
        ].join(" | ");

        const record = await prisma.fiscalCalendar.upsert({
          where: {
            code: code.substring(0, 190),
          },
          update: {
            title,
            description,
            taxType,
            obligationType,
            period: monthName,
            referenceYear: year,
            dueDate,
            officialReference: "Calendário Fiscal AGT",
            source: fileName,
            active: true,
          },
          create: {
            code: code.substring(0, 190),
            title,
            description,
            taxType,
            obligationType,
            period: monthName,
            referenceYear: year,
            dueDate,
            officialReference: "Calendário Fiscal AGT",
            source: fileName,
            active: true,
          },
        });

        for (const regime of regimes) {
          await prisma.fiscalCalendarRegime.upsert({
            where: {
              calendarId_regime: {
                calendarId: record.id,
                regime,
              },
            },
            update: {},
            create: {
              calendarId: record.id,
              regime,
            },
          });
        }

        inserted++;
      }
    }
  }

  return { inserted, skipped };
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log(" CALENDÁRIO FISCAL AGT - IMPORTAÇÃO");
  console.log("==============================================");
  console.log("");

  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(
      `Pasta de dados não encontrada: ${DATA_DIR}`,
    );
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter(
      (file) =>
        file.toLowerCase().endsWith(".xlsx") ||
        file.toLowerCase().endsWith(".xls"),
    );

  if (files.length === 0) {
    throw new Error(
      "Nenhum ficheiro Excel encontrado em prisma/data.",
    );
  }

  console.log("Ficheiros encontrados:");

  for (const file of files) {
    console.log(`  - ${file}`);
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const result = await importWorkbook(file);

    totalInserted += result.inserted;
    totalSkipped += result.skipped;
  }

  console.log("");
  console.log("==============================================");
  console.log(" IMPORTAÇÃO CONCLUÍDA");
  console.log("==============================================");
  console.log(`Registos processados: ${totalInserted}`);
  console.log(`Prazos não convertidos: ${totalSkipped}`);
  console.log("");

  const total = await prisma.fiscalCalendar.count();

  console.log(
    `Total de registos FiscalCalendar na BD: ${total}`,
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ ERRO NO SEED:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

