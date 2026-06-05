import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptPreviewProps {
  receipt: any;
  company: any;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipt, company }) => {
  if (!receipt || !company) return null;

  const settings = company.receiptSettings || {};
  const layout = settings.receiptFormat || 'standard';
  const themeColor = settings.themeColor || '#1e293b'; // Default to slate-800
  const signatureText = settings.signatureText;
  const signatureImage = settings.signatureImage;

  const currency = receipt.currency || company.currency || 'USD';

  // ─────────────────────────────────────────────────────────
  // HELPER COMPONENTS
  // ─────────────────────────────────────────────────────────
  
  const HeaderBlock = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 mb-2">
        {company.logo && (
          <img src={company.logo} alt={company.name} className="h-12 w-auto object-contain rounded-lg" />
        )}
        <h1 className="text-4xl font-black tracking-tighter" style={{ color: themeColor }}>
          {company.name}
        </h1>
      </div>
      <div className="text-sm font-medium text-gray-500 space-y-1">
        {company.address && <p>{company.address}</p>}
        {company.email && <p>{company.email}</p>}
        {company.phone && <p>{company.phone}</p>}
        {settings.whatsappNumber && <p>WA: {settings.whatsappNumber}</p>}
        {settings.taxId && <p className="pt-2 font-bold">Tax ID: {settings.taxId}</p>}
      </div>
    </div>
  );

  const ReceiptInfoBlock = () => (
    <div className="text-right flex flex-col gap-2 items-end">
      <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest">Receipt</h2>
      <div className="mt-4 text-sm space-y-1 text-gray-600">
        <p><span className="font-bold text-gray-900 mr-2">Receipt No:</span> {receipt.receiptNumber}</p>
        <p><span className="font-bold text-gray-900 mr-2">Date:</span> {new Date(receipt.createdAt).toLocaleDateString()}</p>
        <p><span className="font-bold text-gray-900 mr-2">Status:</span> 
          <span className="uppercase tracking-wider font-black ml-1" style={{ color: receipt.status === 'paid' ? '#10b981' : themeColor }}>
            {receipt.status}
          </span>
        </p>
      </div>
    </div>
  );

  const BillToBlock = () => (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Billed To</h3>
      <p className="text-xl font-bold text-gray-900">{receipt.client?.name}</p>
      {receipt.client?.email && <p className="text-sm text-gray-600 mt-1">{receipt.client.email}</p>}
      {receipt.client?.phone && <p className="text-sm text-gray-600 mt-1">{receipt.client.phone}</p>}
      {receipt.client?.address && <p className="text-sm text-gray-600 mt-2">{receipt.client.address}</p>}
    </div>
  );

  const SignatureBlock = () => (
    <div className="mt-12 flex flex-col items-center justify-center text-center">
      {signatureImage ? (
        <img src={signatureImage} alt="Signature" className="h-16 object-contain mb-2" />
      ) : signatureText ? (
        <div className="text-3xl font-serif italic text-gray-800 mb-2 border-b border-gray-300 pb-2 px-8 inline-block">
          {signatureText}
        </div>
      ) : (
        <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
      )}
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authorized Signature</p>
    </div>
  );

  const QRCodeBlock = () => (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
        <QRCodeSVG value={`Receipt:${receipt.receiptNumber}|Amount:${receipt.totalAmount}`} size={80} />
      </div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Scan to Verify</p>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // LAYOUT VARIANTS
  // ─────────────────────────────────────────────────────────

  if (layout === 'modern') {
    return (
      <div id="receipt-preview" className="bg-white text-gray-900 w-full max-w-[800px] mx-auto overflow-hidden relative shadow-2xl" style={{ borderTop: `16px solid ${themeColor}` }}>
        <div className="p-12">
          {settings.letterheadUrl && (
             <img src={settings.letterheadUrl} alt="Letterhead" className="w-full h-auto mb-8 rounded-lg" />
          )}
          
          <div className="mb-12 border-b-2 border-gray-100 pb-8">
            <BillToBlock />
          </div>

          <div className="flex justify-between items-start mb-16">
             <HeaderBlock />
             <ReceiptInfoBlock />
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b-2" style={{ borderBottomColor: themeColor }}>Description</th>
                <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b-2" style={{ borderBottomColor: themeColor }}>Qty</th>
                <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b-2" style={{ borderBottomColor: themeColor }}>Rate</th>
                <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b-2" style={{ borderBottomColor: themeColor }}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receipt.items.map((item: any, i: number) => (
                <tr key={i} className="group">
                  <td className="py-5 px-4 text-sm font-bold text-gray-800">{item.description}</td>
                  <td className="py-5 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-5 px-4 text-sm text-gray-600 text-right">{currency} {item.rate.toLocaleString()}</td>
                  <td className="py-5 px-4 text-sm font-bold text-gray-900 text-right">{currency} {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-72 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span className="font-bold">Subtotal</span>
                <span>{currency} {receipt.subtotal.toLocaleString()}</span>
              </div>
              {receipt.taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                  <span className="font-bold">Tax ({receipt.taxRate}%)</span>
                  <span>{currency} {receipt.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</span>
                <span className="text-2xl font-black tracking-tight" style={{ color: themeColor }}>{currency} {receipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end pt-8 border-t border-gray-200">
            <div className="flex-1">
              {receipt.notes && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Notes & Terms</h4>
                  <p className="text-xs text-gray-600 max-w-sm leading-relaxed">{receipt.notes}</p>
                </div>
              )}
            </div>
            <SignatureBlock />
            <div className="pl-12">
               <QRCodeBlock />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div id="receipt-preview" className="bg-white text-gray-900 w-full max-w-[800px] mx-auto p-16 relative border border-gray-100 shadow-xl">
        <div className="flex justify-between items-end mb-24">
          <h1 className="text-6xl font-black tracking-tighter" style={{ color: themeColor }}>Receipt.</h1>
          <div className="text-right">
            <p className="text-3xl font-light text-gray-400">{receipt.receiptNumber}</p>
            <p className="text-sm font-bold text-gray-900 mt-2">{new Date(receipt.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-16 mb-16 border-b border-gray-100 pb-8">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">To (Customer)</h3>
            <p className="text-lg font-bold text-gray-900">{receipt.client?.name}</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{receipt.client?.address}</p>
            <p className="text-sm text-gray-500">{receipt.client?.email}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">From</h3>
            <div className="flex items-center gap-3 mb-3">
              {company.logo && (
                 <img src={company.logo} alt={company.name} className="h-10 w-auto object-contain rounded-lg" />
              )}
              <p className="text-lg font-bold text-gray-900">{company.name}</p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{company.address}</p>
            <p className="text-sm text-gray-500">{company.email}</p>
          </div>
        </div>

        <div className="mb-20">
          {receipt.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-6 border-b border-gray-100">
               <div>
                 <p className="text-lg font-bold text-gray-800">{item.description}</p>
                 <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{item.quantity} x {currency} {item.rate.toLocaleString()}</p>
               </div>
               <p className="text-xl font-bold text-gray-900">{currency} {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-end mb-20">
          <div className="flex-1"></div>
          <div className="w-80 space-y-4">
             <div className="flex justify-between text-gray-500 font-bold">
               <span>Subtotal</span>
               <span>{currency} {receipt.subtotal.toLocaleString()}</span>
             </div>
             {receipt.taxRate > 0 && (
               <div className="flex justify-between text-gray-500 font-bold">
                 <span>Tax ({receipt.taxRate}%)</span>
                 <span>{currency} {receipt.taxAmount.toLocaleString()}</span>
               </div>
             )}
             <div className="flex justify-between items-baseline pt-4 border-t-2 border-gray-900 mt-4">
               <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total</span>
               <span className="text-4xl font-black tracking-tighter" style={{ color: themeColor }}>{currency} {receipt.totalAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-16 border-t border-gray-100">
           <QRCodeBlock />
           <SignatureBlock />
        </div>
      </div>
    );
  }

  // STANDARD LAYOUT (Default)
  return (
    <div id="receipt-preview" className="bg-white text-gray-900 w-full max-w-[800px] mx-auto p-12 border border-gray-200 shadow-md">
      {settings.letterheadUrl && (
         <img src={settings.letterheadUrl} alt="Letterhead" className="w-full h-auto mb-8" />
      )}
      
      <div className="mb-8 border-b-2 border-gray-200 pb-6 bg-gray-50 p-6 rounded-xl">
        <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase border-b border-gray-200 pb-2">Billed To (Customer)</h3>
        <p className="text-lg font-bold text-gray-800">{receipt.client?.name}</p>
        <p className="text-sm text-gray-600">{receipt.client?.email}</p>
        <p className="text-sm text-gray-600">{receipt.client?.phone}</p>
        <p className="text-sm text-gray-600">{receipt.client?.address}</p>
      </div>

      <div className="flex justify-between border-b-2 pb-8 mb-8" style={{ borderBottomColor: themeColor }}>
         <div className="flex-1">
           <div className="flex items-center gap-4 mb-4">
             {company.logo && (
               <img src={company.logo} alt={company.name} className="h-12 w-auto object-contain rounded-lg" />
             )}
             <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
           </div>
           <div className="text-sm text-gray-600 space-y-1">
             <p>{company.address}</p>
             <p>{company.email} | {company.phone}</p>
             {settings.taxId && <p>Tax ID: {settings.taxId}</p>}
           </div>
         </div>
         <div className="text-right">
           <h2 className="text-4xl font-bold uppercase tracking-wider mb-2" style={{ color: themeColor }}>Receipt</h2>
           <p className="text-sm text-gray-600"><span className="font-bold mr-2">No:</span> {receipt.receiptNumber}</p>
           <p className="text-sm text-gray-600"><span className="font-bold mr-2">Date:</span> {new Date(receipt.createdAt).toLocaleDateString()}</p>
         </div>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
            <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">Qty</th>
            <th className="py-3 px-4 text-right text-xs font-bold text-gray-700 uppercase">Rate</th>
            <th className="py-3 px-4 text-right text-xs font-bold text-gray-700 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-4 px-4 text-sm text-gray-800">{item.description}</td>
              <td className="py-4 px-4 text-sm text-center text-gray-600">{item.quantity}</td>
              <td className="py-4 px-4 text-sm text-right text-gray-600">{currency} {item.rate.toLocaleString()}</td>
              <td className="py-4 px-4 text-sm text-right font-bold text-gray-900">{currency} {item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm text-gray-600">
            <span className="font-bold">Subtotal</span>
            <span>{currency} {receipt.subtotal.toLocaleString()}</span>
          </div>
          {receipt.taxRate > 0 && (
            <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
              <span className="font-bold">Tax ({receipt.taxRate}%)</span>
              <span>{currency} {receipt.taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-4 text-lg font-bold text-gray-900 border-b-2" style={{ borderBottomColor: themeColor }}>
            <span>Total Due</span>
            <span>{currency} {receipt.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="max-w-xs">
          {receipt.notes && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Notes</p>
              <p className="text-xs text-gray-600 italic">{receipt.notes}</p>
            </div>
          )}
          <QRCodeBlock />
        </div>
        <SignatureBlock />
      </div>
    </div>
  );
};
