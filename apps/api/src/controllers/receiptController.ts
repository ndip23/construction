import { Request, Response } from 'express';
import Receipt from '../models/Receipt';
import Company from '../models/Company';
import User from '../models/User';
import nodemailer from 'nodemailer';
import { parseReceiptPrompt } from '../services/aiService';

// SECURITY: escape any user-supplied value before interpolating into email HTML
const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Only allow http(s) image URLs into <img src>
const safeImgUrl = (v: unknown): string => {
  const s = String(v ?? '').trim();
  return /^https?:\/\//i.test(s) ? s.replace(/"/g, '%22') : '';
};

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

export const createReceipt = async (req: any, res: Response) => {
  try {
    const { items, client, project, status, paymentMethod, notes, currency } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) return res.status(403).json({ message: 'Company ID required' });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const receiptNumber = await generateReceiptNumber();

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

export const getReceipts = async (req: any, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ message: 'Company ID required' });

    const receipts = await Receipt.find({ company: companyId }).sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceiptById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const receipt = await Receipt.findById(id).populate('company');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if ((receipt.company as any)._id.toString() !== companyId) {
      return res.status(403).json({ message: 'Unauthorized access to this receipt' });
    }

    res.status(200).json(receipt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReceipt = async (req: any, res: Response) => {
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

export const sendReceiptEmail = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const receipt = await Receipt.findById(id).populate('company');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    if ((receipt.company as any)._id.toString() !== companyId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!receipt.client.email) {
      return res.status(400).json({ message: 'Client email not provided' });
    }

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
        <td style="padding: 16px; font-size: 14px; color: #1f2937;">${esc(item.description)}</td>
        <td style="padding: 16px; font-size: 14px; text-align: center; color: #4b5563;">${esc(item.quantity)}</td>
        <td style="padding: 16px; font-size: 14px; text-align: right; color: #4b5563;">${esc(currency)} ${Number(item.rate).toLocaleString()}</td>
        <td style="padding: 16px; font-size: 14px; text-align: right; font-weight: bold; color: #111827;">${esc(currency)} ${Number(item.total).toLocaleString()}</td>
       </tr>
    `).join('');

    const emailHtml = `...`; // (keep your existing HTML template here)

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

export const getRecentClients = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    const companyId = (user?.company as any)?._id || user?.company;

    if (!companyId) return res.status(404).json({ message: 'Company not found' });

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