'use client';

import * as XLSX from 'xlsx';

interface ExcelTemplateColumn {
  key: string;
  label: string;
  width?: number;
}

interface DownloadExcelTemplateOptions {
  filename: string;
  title: string;
  description?: string;
  sheetName: string;
  columns: ExcelTemplateColumn[];
  rows: Array<Record<string, string | number>>;
}

export const parseSpreadsheetRows = async (file: File): Promise<string[][]> => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (extension === 'csv') {
    const text = await file.text();

    return text
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(',').map((cell) => cell.trim()));
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  return rows
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => row.some((cell) => cell !== ''));
};

export const rowsToCsvText = (rows: string[][]) =>
  rows.map((row) => row.join(',')).join('\n');

export const normalizeImportKey = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');

export const importKeyVariants = (value: unknown) => {
  const normalized = normalizeImportKey(value);
  const decimalNormalized = normalized.replace(/\.0+$/, '');
  const alphanumeric = normalized.replace(/[^0-9A-Za-z]/g, '');
  const decimalAlphanumeric = decimalNormalized.replace(/[^0-9A-Za-z]/g, '');
  const digitsOnly = normalized.replace(/\D/g, '');
  const decimalDigitsOnly = decimalNormalized.replace(/\D/g, '');
  const withoutLeadingZeros = normalized.replace(/^0+(?=\d)/, '');
  const decimalWithoutLeadingZeros = decimalNormalized.replace(/^0+(?=\d)/, '');
  const alphanumericWithoutLeadingZeros = alphanumeric.replace(/^0+(?=\d)/, '');
  const decimalAlphanumericWithoutLeadingZeros = decimalAlphanumeric.replace(/^0+(?=\d)/, '');
  const digitsWithoutLeadingZeros = digitsOnly.replace(/^0+(?=\d)/, '');
  const decimalDigitsWithoutLeadingZeros = decimalDigitsOnly.replace(/^0+(?=\d)/, '');
  const numericValue = Number(normalized);
  const numericPlain =
    Number.isFinite(numericValue) && Number.isInteger(numericValue)
      ? numericValue.toFixed(0)
      : '';

  return Array.from(
    new Set([
      normalized,
      decimalNormalized,
      withoutLeadingZeros,
      decimalWithoutLeadingZeros,
      alphanumeric,
      decimalAlphanumeric,
      alphanumericWithoutLeadingZeros,
      decimalAlphanumericWithoutLeadingZeros,
      digitsOnly,
      decimalDigitsOnly,
      digitsWithoutLeadingZeros,
      decimalDigitsWithoutLeadingZeros,
      numericPlain,
    ].filter(Boolean))
  );
};

export const findStudentByImportKey = <T extends { nis: string }>(
  studentsByNis: Map<string, T>,
  value: unknown,
) => {
  for (const key of importKeyVariants(value)) {
    const student = studentsByNis.get(key);

    if (student !== undefined) {
      return student;
    }
  }

  return undefined;
};

export const normalizeImportHeader = (value: unknown) =>
  normalizeImportKey(value).toLowerCase();

export const findImportHeaderRowIndex = (
  rows: string[][],
  requiredHeaders: string[],
) => {
  const required = requiredHeaders.map(normalizeImportHeader);

  return rows.findIndex((row) => {
    const normalizedRow = row.map(normalizeImportHeader);

    return required.every((header) => normalizedRow.includes(header));
  });
};

export const parseDelimitedRows = (text: string) =>
  text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => splitDelimitedRow(row));

const splitDelimitedRow = (row: string) => {
  const delimiter = detectDelimiter(row);
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const nextChar = row[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
};

const detectDelimiter = (row: string) => {
  const candidates = [',', ';', '\t'] as const;

  return candidates.reduce((bestDelimiter, delimiter) => {
    const bestCount = countDelimiter(row, bestDelimiter);
    const currentCount = countDelimiter(row, delimiter);

    return currentCount > bestCount ? delimiter : bestDelimiter;
  }, ',');
};

const countDelimiter = (row: string, delimiter: ',' | ';' | '\t') => {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const nextChar = row[index + 1];

    if (char === '"' && nextChar === '"') {
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
};

export const downloadGradeTemplate = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) => {
  downloadExcelTemplate({
    filename,
    title: filename.replace(/\.xlsx$/i, ''),
    description: 'Isi data pada baris yang tersedia. Jangan mengubah nama kolom.',
    sheetName: 'Template',
    columns: headers.map((header) => ({
      key: header,
      label: header,
      width: Math.max(header.length + 2, 12),
    })),
    rows: rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
    ),
  });
};

export const downloadExcelTemplate = ({
  filename,
  title,
  description = 'Isi data pada baris yang tersedia. Jangan mengubah nama kolom.',
  sheetName,
  columns,
  rows,
}: DownloadExcelTemplateOptions) => {
  const headers = columns.map((column) => column.label);
  const rowValues = rows.map((row) => columns.map((column) => row[column.key] ?? ''));
  const columnCount = Math.max(columns.length, 1);
  const lastColumnIndex = columnCount - 1;
  const lastColumn = XLSX.utils.encode_col(lastColumnIndex);
  const headerRowIndex = 4;
  const worksheet = XLSX.utils.aoa_to_sheet([
    [title],
    [description],
    ['Format file: .xlsx. Baris header berada pada baris 5 dan data dimulai dari baris 6.'],
    [],
    headers,
    ...rowValues,
  ]);
  const workbook = XLSX.utils.book_new();
  const dataEndRow = Math.max(headerRowIndex + rowValues.length + 1, headerRowIndex + 1);

  worksheet['!cols'] = columns.map((column) => ({
    wch: column.width ?? Math.max(column.label.length + 4, 14),
  }));
  worksheet['!rows'] = [
    { hpt: 28 },
    { hpt: 22 },
    { hpt: 20 },
    { hpt: 8 },
    { hpt: 24 },
  ];
  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: lastColumnIndex },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: lastColumnIndex },
    },
    {
      s: { r: 2, c: 0 },
      e: { r: 2, c: lastColumnIndex },
    },
  ];
  worksheet['!autofilter'] = {
    ref: `A5:${lastColumn}${dataEndRow}`,
  };
  worksheet['!freeze'] = {
    xSplit: 0,
    ySplit: 5,
    topLeftCell: 'A6',
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  applyTemplateStyles(worksheet, lastColumnIndex, dataEndRow);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

const applyTemplateStyles = (
  worksheet: XLSX.WorkSheet,
  lastColumnIndex: number,
  dataEndRow: number,
) => {
  const titleCell = worksheet.A1;
  const descriptionCell = worksheet.A2;
  const noteCell = worksheet.A3;

  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  if (descriptionCell) {
    descriptionCell.s = {
      font: { italic: true, color: { rgb: '475569' } },
      alignment: { vertical: 'center' },
    };
  }

  if (noteCell) {
    noteCell.s = {
      font: { color: { rgb: '64748B' } },
      alignment: { vertical: 'center' },
    };
  }

  for (let column = 0; column <= lastColumnIndex; column += 1) {
    const headerAddress = XLSX.utils.encode_cell({ r: 4, c: column });
    const headerCell = worksheet[headerAddress];

    if (headerCell) {
      headerCell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1D4ED8' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      };
    }
  }

  for (let row = 5; row < dataEndRow; row += 1) {
    for (let column = 0; column <= lastColumnIndex; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[address];

      if (cell) {
        cell.s = {
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
      }
    }
  }
};
