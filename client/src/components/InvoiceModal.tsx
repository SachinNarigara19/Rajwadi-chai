import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, X, Check, Copy, Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Sale, BusinessSettings } from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings?: BusinessSettings | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale, settings }) => {
  const [format, setFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (isOpen && sale && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, sale.invoiceNumber, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [isOpen, sale, format]);

  if (!isOpen || !sale) return null;

  const shopName = settings?.shopName || 'Jay Mataji Rajwadi Chai';
  const tagline = settings?.tagline || 'Taste of Royal Heritage - Authentic Rajwadi Tea & Snacks';
  const address =
    settings?.address ||
    'Shop No. 24, Shiv Shopping Center, Sagvadi  , Virani circale to Water Tank Road, near by Rameshvar Mahadev Temple  bhavnagar.';
  const phone = settings?.phone || '8401256000';

  // Dedicated Print Function: Uses isolated iframe to prevent white page bugs in all browsers
  const handlePrint = () => {
    const printContent = document.getElementById('thermal-receipt-area');
    if (!printContent) {
      window.print();
      return;
    }

    let iframe = document.getElementById('print-receipt-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-receipt-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const receiptWidth = format === '58mm' ? '280px' : format === '80mm' ? '360px' : '650px';
    const fontFamily = format === 'a4' ? 'sans-serif' : 'monospace';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shopName} - Invoice ${sale.invoiceNumber}</title>
          <style>
            @page { margin: 3mm; size: auto; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 10px;
              background: #fff;
              color: #000;
              font-family: ${fontFamily};
              font-size: 12px;
              display: flex;
              justify-content: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-wrapper {
              width: ${receiptWidth};
              max-width: 100%;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 1px; }
            .border-b { border-bottom: 1px dashed #666; }
            .border-t { border-top: 1px dashed #666; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            img { max-width: 56px; height: auto; display: block; margin: 0 auto 6px auto; border-radius: 50%; }
            svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  // Direct PDF Generator: generates real PDF file on the fly
  const handleDownloadPdf = async () => {
    const element = document.getElementById('thermal-receipt-area');
    if (!element) return;

    setGeneratingPdf(true);
    try {
      const opt = {
        margin: 4,
        filename: `Invoice_${sale.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: {
          unit: 'mm' as const,
          format: (format === '58mm' ? [58, 220] : format === '80mm' ? [80, 260] : 'a4') as any,
          orientation: 'portrait' as const,
        },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation error, fallback to print:', err);
      handlePrint();
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShare = () => {
    const text = `Invoice from ${shopName}\nInvoice No: ${sale.invoiceNumber}\nTotal: ₹${sale.total}\nDate: ${new Date(sale.createdAt).toLocaleString('en-IN')}\nOwner: PRINCE DUMARALIYA (Mo. 8401256000)\nThank you for visiting!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto invoice-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] invoice-modal-card">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-600/30 no-print">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👑</span>
            <div>
              <h2 className="text-lg font-bold text-amber-400 leading-tight">Invoice & Thermal Receipt</h2>
              <p className="text-xs text-stone-400">Invoice: {sale.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Format Selector & Actions Bar */}
        <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Format:</span>
            <div className="inline-flex rounded-lg border border-stone-300 bg-white p-1 text-xs">
              <button
                onClick={() => setFormat('80mm')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  format === '80mm' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                80mm Thermal
              </button>
              <button
                onClick={() => setFormat('58mm')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  format === '58mm' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                58mm Thermal
              </button>
              <button
                onClick={() => setFormat('a4')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  format === 'a4' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                Standard A4
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold shadow-xs transition disabled:opacity-50"
              title="Download direct PDF file"
            >
              {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{generatingPdf ? 'Creating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
              title="Print Receipt or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>

        {/* Printable & Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50 flex justify-center invoice-preview-area">
          <div
            id="thermal-receipt-area"
            className={`bg-white p-6 shadow-sm border border-stone-200 text-stone-900 transition-all ${
              format === '58mm'
                ? 'w-[280px] text-xs font-mono'
                : format === '80mm'
                ? 'w-[360px] text-xs font-mono'
                : 'w-full max-w-xl text-sm font-sans'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-stone-400">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-14 h-14 mx-auto mb-2 rounded-full object-cover shadow-xs border border-amber-500/30"
              />
              <h1 className="text-base font-extrabold uppercase tracking-wide text-stone-900 m-0">
                {shopName}
              </h1>
              <p className="text-[11px] text-stone-600 mt-0.5">{tagline}</p>
              <p className="text-[10px] text-stone-500 mt-1 leading-tight">{address}</p>
              <p className="text-[10px] text-stone-600 font-semibold mt-0.5">Phone: {phone}</p>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Invoice:</span>
                <span className="font-bold text-stone-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Date/Time:</span>
                <span>{new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Cashier:</span>
                <span>{sale.cashier?.name || 'Counter'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Customer:</span>
                <span className="font-semibold">{sale.customer?.name || 'Walk-in Customer'}</span>
              </div>
              {sale.customer?.mobile && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Mobile:</span>
                  <span>{sale.customer.mobile}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-2.5 border-b border-dashed border-stone-400">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-stone-300 text-stone-600">
                    <th className="text-left py-1 font-semibold">Item</th>
                    <th className="text-center py-1 font-semibold">Qty</th>
                    <th className="text-right py-1 font-semibold">Rate</th>
                    <th className="text-right py-1 font-semibold">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 text-left pr-1">
                        <div className="font-medium text-stone-900 leading-tight">{item.productName}</div>
                        {item.product?.isAgeRestricted && (
                          <span className="text-[9px] text-rose-600 font-bold">[18+ Verified]</span>
                        )}
                      </td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono">₹{item.unitPrice}</td>
                      <td className="py-1.5 text-right font-bold font-mono">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal:</span>
                <span className="font-mono">₹{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{sale.discount.toFixed(2)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Tax:</span>
                  <span className="font-mono">+₹{sale.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-stone-300 pt-1 text-stone-900">
                <span>Grand Total:</span>
                <span className="font-mono">₹{sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-0.5">
                <span className="text-stone-600">Payment ({sale.paymentMethod}):</span>
                <span className="font-bold text-stone-900 font-mono">₹{sale.paidAmount.toFixed(2)}</span>
              </div>
              {sale.changeAmount > 0 && (
                <div className="flex justify-between text-[10px] text-stone-600">
                  <span>Change Returned:</span>
                  <span className="font-mono">₹{sale.changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center">
              <div className="flex justify-center">
                <svg ref={barcodeRef} className="max-w-full"></svg>
              </div>
              <p className="text-xs font-semibold text-stone-800 mt-2">
                Thank you for visiting Jay Mataji Rajwadi Chai!
              </p>
              <p className="text-[10px] text-stone-600 mt-0.5 font-bold">
                Owner: PRINCE DUMARALIYA • Mo. 8401256000
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Instagram: @jaymataji_rajwadichai01
              </p>
              <p className="text-[9px] text-stone-400 mt-1">
                Computer Generated Invoice - No Signature Required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
