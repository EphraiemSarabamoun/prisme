declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  export default function pdfParse(buffer: Buffer): Promise<PDFData>;
}
