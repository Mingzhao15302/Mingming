import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuotePayload {
  title: string;
  customer: string;
  salesperson: string;
  discount: number;
  lines: QuoteLine[];
}

export async function generateQuotePdf(payload: QuotePayload, filepath: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const drawText = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y, size, font, color: rgb(0.1, 0.2, 0.3) });
    y -= size + 8;
  };

  drawText(payload.title, 20);
  drawText(`客户：${payload.customer}`);
  drawText(`业务员：${payload.salesperson}`);
  drawText(`折扣：${payload.discount * 100}%`);
  drawText('');

  const headerY = y;
  page.drawText('描述', { x: 50, y: headerY, size: 12, font });
  page.drawText('数量', { x: 250, y: headerY, size: 12, font });
  page.drawText('单价', { x: 320, y: headerY, size: 12, font });
  page.drawText('小计', { x: 410, y: headerY, size: 12, font });
  y -= 24;

  payload.lines.forEach((line) => {
    const subtotal = line.quantity * line.unitPrice;
    page.drawText(line.description, { x: 50, y, size: 11, font });
    page.drawText(String(line.quantity), { x: 250, y, size: 11, font });
    page.drawText(line.unitPrice.toFixed(2), { x: 320, y, size: 11, font });
    page.drawText(subtotal.toFixed(2), { x: 410, y, size: 11, font });
    y -= 20;
  });

  const total = payload.lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  const discounted = total * (1 - payload.discount);
  drawText('');
  drawText(`总计：¥${total.toFixed(2)}`);
  drawText(`优惠后金额：¥${discounted.toFixed(2)}`);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filepath, pdfBytes);
}
