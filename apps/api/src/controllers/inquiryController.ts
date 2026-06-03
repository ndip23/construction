import { Request, Response } from 'express';
import Company from '../models/Company';
import Inquiry from '../models/Inquiry';

const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

const buildWhatsAppUrl = (phone: string, message?: string) => {
  const clean = cleanPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${text}`;
};

export const createPublicInquiry = async (req: Request, res: Response) => {
  try {
    const { companyId, clientName, clientPhone, message, source } = req.body;

    if (!companyId || !clientName || !clientPhone || !message) {
      return res.status(400).json({ message: 'Please include your name, phone number, and message.' });
    }

    if (cleanPhone(String(clientPhone)).length < 8) {
      return res.status(400).json({ message: 'Please enter a valid WhatsApp number with country code.' });
    }

    const company = await Company.findById(companyId).select('name phone');
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const inquiry = await Inquiry.create({
      company: company._id,
      clientName,
      clientPhone,
      message,
      source: source || 'public_profile',
    });

    const whatsappUrl = company.phone
      ? buildWhatsAppUrl(
          company.phone,
          `Hello ${company.name}, I'm ${clientName} (${clientPhone}). ${message}`
        )
      : null;

    res.status(201).json({
      message: 'Inquiry saved successfully.',
      inquiry,
      whatsappUrl,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to save inquiry.' });
  }
};

export const getCompanyInquiries = async (req: any, res: Response) => {
  try {
    const inquiries = await Inquiry.find({ company: req.user.companyId })
      .sort({ createdAt: -1 })
      .populate('company', 'name slug phone logo');

    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load inquiries.' });
  }
};

export const updateInquiryStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid inquiry status.' });
    }

    const inquiry = await Inquiry.findOne({ _id: id, company: req.user.companyId });
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    inquiry.status = status;
    if (status === 'contacted') {
      inquiry.lastContactedAt = new Date();
    }

    await inquiry.save();

    res.status(200).json({ message: 'Inquiry status updated.', inquiry });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inquiry status.' });
  }
};
