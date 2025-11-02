import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface QuotePdfPayload {
  title: string;
  customer: string;
  salesperson: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export async function generateQuotePdf(payload: QuotePdfPayload, filename?: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;
  const writeLine = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y, size, font });
    y -= size + 8;
  };

  writeLine(payload.title, 20);
  writeLine(`客户：${payload.customer}`);
  writeLine(`业务员：${payload.salesperson}`);
  writeLine('明细：');

  payload.items.forEach((item, index) => {
    writeLine(`${index + 1}. ${item.name} x${item.quantity}  单价 ¥${item.price.toFixed(2)}`);
  });

  y -= 10;
  writeLine(`合计：¥${payload.total.toFixed(2)}`, 14);

  const pdfBytes = await pdfDoc.save();
  const exportDir = path.resolve(process.cwd(), '..', 'exports', 'quotes');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  const safeFilename = filename ?? `quote-${Date.now()}.pdf`;
  const outputPath = path.join(exportDir, safeFilename);
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}
