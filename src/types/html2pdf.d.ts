declare module 'html2pdf.js' {
  interface Html2PdfWorker {
    set(opt: Record<string, unknown>): Html2PdfWorker;
    from(el: Element | string): Html2PdfWorker;
    save(): Promise<void>;
    toPdf(): Html2PdfWorker;
  }
  export default function html2pdf(): Html2PdfWorker;
}
