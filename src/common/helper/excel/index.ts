import * as XlsxTemplate from 'xlsx-template';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '@prisma/client';

export const genExcelFormImportProducts = (products?: Product[]): Buffer => {
  const templatePath = path.join(
    __dirname,
    'templates',
    'product-imports.xlsx',
  );

  const templateData = fs.readFileSync(templatePath);

  const template = new XlsxTemplate(templateData);

  let productsData: {
    importOrder: number;
    code: string;
    name: string;
    status: string;
  }[];

  if (products) {
    productsData = products.map((product, index) => ({
      importOrder: index + 1,
      code: product.code,
      name: product.name,
      status: product.status,
    }));
  } else {
    productsData = [
      {
        importOrder: 1,
        code: 'PDEXAMPLE',
        name: '(Tùy chọn)',
        status: '(Tùy chọn)',
      },
    ];
  }

  const formData = {
    products: productsData,
  };

  template.substitute(1, formData);

  return Buffer.from(template.generate(), 'binary');
};

export const genResultImportProductsFromExcel = (
  importedAt: Date,
  completedAt: Date,
  resultImports: {
    importOrder: number;
    code: string;
    name: string;
    importQuantity: number;
    importPrice: number;
    success: boolean;
    importErrorMessage?: string;
  }[],
) => {
  const templatePath = path.join(
    __dirname,
    'templates',
    'result-product-imports.xlsx',
  );

  const templateData = fs.readFileSync(templatePath);

  const template = new XlsxTemplate(templateData);

  const totalImportProducts = resultImports.length;
  let numbersOfSuccess = 0;
  const productsData = resultImports.map((item) => {
    if (item.success === true) numbersOfSuccess++;
    return {
      ...item,
      importStatus: item.success ? 'Thành công' : 'Thất bại',
    };
  });
  const numbersOfFail = totalImportProducts - numbersOfSuccess;

  const formData = {
    importedAt: importedAt.toLocaleString(),
    completedAt: completedAt.toLocaleString(),
    totalImportProducts,
    numbersOfSuccess,
    numbersOfFail,
    products: productsData,
  };

  template.substitute(1, formData);

  return Buffer.from(template.generate(), 'binary');
};

export const extractHeader = (ws: XLSX.WorkSheet, rowHeaders = 1) => {
  const headers = [];
  const columnCount = XLSX.utils.decode_range(ws['!ref']).e.c + 1;
  for (let i = 0; i < columnCount; ++i) {
    headers[i] = ws[`${XLSX.utils.encode_col(i)}${rowHeaders}`]?.v || '';
  }
  return headers.filter((header) => header !== '');
};

export const extractData = (ws: XLSX.WorkSheet, rowHeaders = 1) => {
  return XLSX.utils.sheet_to_json(ws, {
    range: rowHeaders - 1,
  });
};

const genExcelFromData = (fileName: string, data: any): string => {
  fileName += `-${Date.now()}.xlsx`;
  const filePathDir = path.join(__dirname, 'tmp');
  const filePath = path.join(filePathDir, fileName);
  if (!fs.existsSync(filePathDir)) {
    fs.mkdirSync(filePathDir, { recursive: true });
  }
  fs.writeFileSync(filePath, data);
  return filePath;
};
