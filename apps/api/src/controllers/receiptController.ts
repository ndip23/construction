import { Request, Response } from 'express';
import Receipt from '../models/Receipt';
import Company from '../models/Company';
import User from '../models/User';
import nodemailer from 'nodemailer';
import { parseReceiptPrompt } from '../services/aiService';
import Company from '../models/Company';
import nodemailer from 'nodemailer';

// Generate a unique receipt number: REC-YYYY-XXXXXX
const generateReceiptNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const lastReceipt = await Receipt.findOne({ receiptNumber: new RegExp(`^REC-${year}-`) })
    .sort({ createdAt: -1 });

  let sequence = 1;
  if (lastReceipt) {
    const parts = lastReceipt.receiptNumber.split('-');
    sequence = parseInt(parts[2], 10) + 1;
  }
  return `REC-${year}-${sequence.toString().padStart(6, '0')}`;
};

export const createReceipt = async (req: Request, res: Response) => {
  try {
    const { items, client, project, status, paymentMethod, notes, currency } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(403).json({ message: 'Company ID required' });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const receiptNumber = await generateReceiptNumber();

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const taxRate = company.receiptSettings?.defaultTaxRate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const qrCodeData = `${process.env.FRONTEND_URL}/verify/receipt/${receiptNumber}`;

    const receipt = new Receipt({
      receiptNumber,
      company: companyId,
      project,
      client,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: currency || company.currency || 'USD',
      status: status || 'draft',
      paymentMethod,
      notes: notes || company.receiptSettings?.defaultPaymentTerms,
      qrCodeData
    });

    const savedReceipt = await receipt.save();
    res.status(201).json(savedReceipt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceipts = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ message: 'Company ID required' });

    const receipts = await Receipt.find({ company: companyId }).sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceiptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const receipt = await Receipt.findById(id).populate('company');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (receipt.company._id.toString() !== companyId) {
       return res.status(403).json({ message: 'Unauthorized access to this receipt' });
    }

    res.status(200).json(receipt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const receipt = await Receipt.findById(id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (receipt.company.toString() !== companyId) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    await Receipt.findByIdAndDelete(id);
    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendReceiptEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const receipt = await Receipt.findById(id).populate('company');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if (receipt.company._id.toString() !== companyId) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!receipt.client.email) {
      return res.status(400).json({ message: 'Client email not provided' });
    }

    // A mock transporter for demo/testing or use standard env variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    });

    const currency = receipt.currency || 'USD';
    const settings = (receipt.company as any).receiptSettings || {};
    const themeColor = settings.themeColor || '#1e293b';

    const itemsHtml = receipt.items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px; font-size: 14px; color: #1f2937;">${item.description}</td>
        <td style="padding: 16px; font-size: 14px; text-align: center; color: #4b5563;">${item.quantity}</td>
        <td style="padding: 16px; font-size: 14px; text-align: right; color: #4b5563;">${currency} ${item.rate.toLocaleString()}</td>
        <td style="padding: 16px; font-size: 14px; text-align: right; font-weight: bold; color: #111827;">${currency} ${item.total.toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; background: #ffffff;">
        ${settings.letterheadUrl ? `<img src="${settings.letterheadUrl}" alt="Letterhead" style="width: 100%; height: auto; margin-bottom: 30px;" />` : ''}

        <table style="width: 100%; border-bottom: 2px solid ${themeColor}; padding-bottom: 30px; margin-bottom: 30px;">
          <tr>
            <td style="vertical-align: top;">
              <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">${(receipt.company as any).name}</h1>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #4b5563;">${(receipt.company as any).address || ''}</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #4b5563;">${(receipt.company as any).email || ''} | ${(receipt.company as any).phone || ''}</p>
              ${settings.taxId ? `<p style="margin: 0; font-size: 14px; color: #4b5563;">Tax ID: ${settings.taxId}</p>` : ''}
            </td>
            <td style="vertical-align: top; text-align: right;">
              <h2 style="font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; color: ${themeColor};">Receipt</h2>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #4b5563;"><strong>No:</strong> ${receipt.receiptNumber}</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #4b5563;"><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleDateString()}</p>
            </td>
          </tr>
        </table>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Billed To</h3>
          <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 4px 0;">${receipt.client.name}</p>
          ${receipt.client.email ? `<p style="font-size: 14px; color: #4b5563; margin: 0 0 4px 0;">${receipt.client.email}</p>` : ''}
          ${receipt.client.phone ? `<p style="font-size: 14px; color: #4b5563; margin: 0 0 4px 0;">${receipt.client.phone}</p>` : ''}
          ${receipt.client.address ? `<p style="font-size: 14px; color: #4b5563; margin: 0 0 4px 0;">${receipt.client.address}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">Item</th>
              <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">Qty</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">Rate</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-bottom: 40px;">
          <tr>
            <td style="width: 60%;"></td>
            <td style="width: 40%;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4b5563;">
                <strong>Subtotal</strong>
                <span>${currency} ${receipt.subtotal.toLocaleString()}</span>
              </div>
              ${receipt.taxRate > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">
                <strong>Tax (${receipt.taxRate}%)</strong>
                <span>${currency} ${receipt.taxAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 16px 0; font-size: 18px; font-weight: bold; color: #111827; border-bottom: 2px solid ${themeColor};">
                <span>Total Due</span>
                <span>${currency} ${receipt.totalAmount.toLocaleString()}</span>
              </div>
            </td>
          </tr>
        </table>

        <table style="width: 100%;">
          <tr>
            <td style="vertical-align: bottom;">
              ${receipt.notes ? `
              <div style="margin-bottom: 16px;">
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin: 0 0 4px 0;">Notes</p>
                <p style="font-size: 12px; color: #4b5563; font-style: italic; margin: 0;">${receipt.notes}</p>
              </div>
              ` : ''}
            </td>
            <td style="vertical-align: bottom; text-align: right;">
              ${settings.signatureImage ? `<img src="${settings.signatureImage}" alt="Signature" style="height: 64px; object-fit: contain; margin-bottom: 8px;" />` :
                settings.signatureText ? `<div style="font-size: 24px; font-family: Georgia, serif; font-style: italic; color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 8px; display: inline-block;">${settings.signatureText}</div>` :
                `<div style="width: 192px; border-bottom: 2px solid #d1d5db; margin-bottom: 8px; display: inline-block;"></div>`
              }
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin: 0;">Authorized Signature</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    await transporter.sendMail({
      from: `"${(receipt.company as any).name}" <noreply@buildhub.com>`,
      to: receipt.client.email,
      subject: `Receipt ${receipt.receiptNumber} from ${(receipt.company as any).name}`,
      html: emailHtml
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const parseReceiptAI = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const aiResult = await parseReceiptPrompt(prompt);

    // Add total to each item since the AI doesn't calculate it
    if (aiResult.items && Array.isArray(aiResult.items)) {
      aiResult.items = aiResult.items.map((item: any) => ({
        ...item,
        total: (item.quantity || 1) * (item.rate || 0)
      }));
    }

    res.status(200).json(aiResult);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'AI parsing failed' });
  }
};

export const getRecentClients = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    const companyId = (user?.company as any)?._id || user?.company;

    if (!companyId) return res.status(404).json({ message: 'Company not found' });

    // Aggregate to get unique clients by name
    const clients = await Receipt.aggregate([
      { $match: { company: companyId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$client.name",
          client: { $first: "$client" },
          lastReceiptDate: { $first: "$createdAt" }
        }
      },
      { $sort: { lastReceiptDate: -1 } },
      { $limit: 20 },
      { $replaceRoot: { newRoot: "$client" } }
    ]);

    res.status(200).json(clients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
