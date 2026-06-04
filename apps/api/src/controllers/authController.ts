import { Request, Response } from 'express';
import multer from 'multer';
import User from '../models/User';
import Company from '../models/Company';
import { ensureCompanyHasSlug } from '../utils/companySlug';
import Project from '../models/Project';
import Invoice from '../models/Invoice';
import Tender from '../models/Tender';
import Message from '../models/Message';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Service from '../models/Service';
import Order from '../models/Order';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @desc    Register + Auto-generate Slug
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName, city, country, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, role: role || 'owner' });
    await user.save();

    const company = new Company({ 
      name: companyName, city, country, owner: user._id, status: 'pending' 
    });
    await company.save(); // Model middleware handles slug generation

    user.company = company._id as any;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: company._id, slug: company.slug },
      process.env.JWT_SECRET!, { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: "BuildHub Office Initialized",
      token, 
      user: { id: user._id, name: user.name, role: user.role, companyId: company._id, slug: company.slug } 
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed at infrastructure level." });
  }
};

// @desc    Login + Return Slug
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('company');
    if (!user) return res.status(404).json({ message: "Identity not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    const companyDoc = user.company as any;
    if (companyDoc && !companyDoc.slug) {
      await ensureCompanyHasSlug(companyDoc);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: companyDoc?._id, slug: companyDoc?.slug },
      process.env.JWT_SECRET!, { expiresIn: '7d' }
    );

    res.status(200).json({ 
      token, 
      user: { 
         id: user._id, 
    name: user.name, 
    role: user.role, 
    companyId: companyDoc?._id, 
    company: companyDoc?.name,
    slug: companyDoc?.slug
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Login authentication failed." });
  }
};

const getAuthorizedCompany = async (req: any, slug?: string) => {
  let company = slug && slug !== 'undefined'
    ? await Company.findOne({ slug })
    : null;

  if (!company && req.user?.companyId) {
    company = await Company.findById(req.user.companyId);
    if (company && !company.slug) {
      await ensureCompanyHasSlug(company);
    }
  }

  if (!company) return null;
  if (company._id.toString() !== req.user.companyId.toString()) return null;
  return company;
};

// @desc    Get logged-in user's company profile (slug-safe)
export const getMyCompanyProfile = async (req: any, res: Response) => {
  try {
    const company = await getAuthorizedCompany(req);
    if (!company) return res.status(404).json({ message: "Business profile not found." });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error retrieving business data." });
  }
};

// @desc    Get Company by Slug (Fixes 404)
export const getCompanyBySlug = async (req: any, res: Response) => {
  try {
    const company = await getAuthorizedCompany(req, req.params.slug);
    if (!company) return res.status(404).json({ message: "Business profile not found." });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error retrieving business data." });
  }
};

// @desc    Update Company by Slug
export const updateCompanyBySlug = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    
    const company = await Company.findOne({ slug });
    if (!company || company._id.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: "Unauthorized update attempt." });
    }

    const updated = await Company.findOneAndUpdate({ slug }, req.body, { new: true });
    res.status(200).json({ message: "Business profile secured and updated", company: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed." });
  }
};

// @desc    Dashboard Summary
export const getSummary = async (req: any, res: Response) => {
  try {
    const companyId = req.user.companyId;
    const [projectCount, invoiceCount, tenderCount, msgCount, invoices, serviceCount, orders] = await Promise.all([
      Project.countDocuments({ company: companyId }),
      Invoice.countDocuments({ company: companyId, status: 'Pending' }),
      Tender.countDocuments({ status: 'Open' }),
      Message.countDocuments({ isRead: false }),
      Invoice.find({ company: companyId }),
      Service.countDocuments({ company: companyId }),
      Order.find({ company: companyId })
    ]);

    const totalIncome = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const outstanding = invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalExpenses = orders.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Calculate Dynamic Expense Breakdown based on Orders
    const expensesByCategory: Record<string, number> = {};
    orders.forEach(order => {
      const name = order.itemName || 'Misc';
      expensesByCategory[name] = (expensesByCategory[name] || 0) + (order.amount || 0);
    });

    let expenseBreakdown = Object.keys(expensesByCategory).map(key => {
      const percentage = totalExpenses > 0 ? Math.round((expensesByCategory[key] / totalExpenses) * 100) : 0;
      return { label: key, value: percentage };
    }).sort((a, b) => b.value - a.value).slice(0, 4);

    if (expenseBreakdown.length === 0) {
      expenseBreakdown = []; // Will handle zero-state in UI
    }

    res.status(200).json({
      projectCount, invoiceCount, tenderCount, msgCount, serviceCount,
      totalIncome, totalExpenses, outstanding, balance: totalIncome - totalExpenses,
      expenseBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to aggregate dashboard data." });
  }
};

// @desc    Get AI Finance Insights
export const getFinanceInsights = async (req: any, res: Response) => {
  try {
    const companyId = req.user.companyId;
    const [invoices, serviceCount, company, orders, services] = await Promise.all([
      Invoice.find({ company: companyId }),
      Service.countDocuments({ company: companyId }),
      Company.findById(companyId),
      Order.find({ company: companyId }),
      Service.find({ company: companyId }).limit(5)
    ]);

    const totalIncome = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const outstanding = invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalExpenses = orders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const serviceNames = services.map(s => s.name).join(', ') || 'No specific services listed yet';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "AI Integration not configured" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a top-tier construction financial analyst. 
Review the following real financial data for a construction company named "${company?.name || 'Company'}":
- Total Income (Paid Invoices): $${totalIncome}
- Outstanding Invoices: $${outstanding}
- Total Expenses (Material/Equipment Orders): $${totalExpenses}
- Total Active Services/Products on Marketplace: ${serviceCount}
- Top Services Provided: ${serviceNames}
- Total Invoice Count: ${invoices.length}

You must return a strictly formatted JSON object with exactly the following 6 keys. Do not include markdown blocks (\`\`\`json) or any outside text. Just the raw JSON. If they have $0 in values, calculate a score of 0 and strongly advise them to start listing services and making transactions.
{
  "performanceScore": "An integer between 0 and 100 representing their financial health based on income vs expenses, outstanding debt, and service volume. Ensure it is a Number.",
  "scoreSuggestion": "1 specific sentence on exactly what to do to increase their performance score.",
  "productROI": "Analyze the return on investment based on their listed products and units. 2 sentences.",
  "serviceProjection": "Project expected income based on the types of services listed. 2 sentences.",
  "investmentStrategy": "Provide suggestions on where to invest money. If $0 profit, suggest how to secure jobs. 2 sentences.",
  "operationalRisk": "Analyze risk factors (e.g., zero presence, overdue invoices). 2 sentences."
}`;

    const result = await model.generateContent(prompt);
    let textResult = result.response.text().trim();
    if (textResult.startsWith('\`\`\`json')) {
      textResult = textResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (textResult.startsWith('\`\`\`')) {
      textResult = textResult.replace(/\`\`\`/g, '').trim();
    }
    
    let insights;
    try {
      insights = JSON.parse(textResult);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResult);
      // Fallback object
      insights = {
        performanceScore: 0,
        scoreSuggestion: "Data parsing error. Please try again.",
        productROI: "Data parsing error.",
        serviceProjection: "Data parsing error.",
        investmentStrategy: "Data parsing error.",
        operationalRisk: "Data parsing error."
      };
    }

    res.status(200).json({ insights });
  } catch (error) {
    console.error("AI Finance Insight Error:", error);
    res.status(500).json({ message: "Failed to generate financial insights." });
  }
};
export const updateCompanyLogo = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    const company = await getAuthorizedCompany(req, req.params.slug);
    if (!company) return res.status(403).json({ message: "Unauthorized update attempt." });

    company.logo = req.file.path;
    await company.save();

    res.status(200).json({ message: "Logo updated in cloud", logo: company.logo });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: "Cloudinary upload failed" });
  }
};

export const updateCompanyLetterhead = async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    const company = await getAuthorizedCompany(req, req.params.slug);
    if (!company) return res.status(403).json({ message: "Unauthorized update attempt." });

    if (!company.receiptSettings) company.receiptSettings = {};
    company.receiptSettings.letterhead = req.file.path;
    await company.save();

    res.status(200).json({ message: "Letterhead updated in cloud", letterhead: company.receiptSettings.letterhead });
  } catch (error) {
    console.error('Letterhead upload error:', error);
    res.status(500).json({ message: "Cloudinary upload failed" });
  }
};

export const updateCompanyPortfolio = async (req: any, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: "No photos provided" });

    const company = await getAuthorizedCompany(req, req.params.slug);
    if (!company) return res.status(403).json({ message: "Unauthorized update attempt." });

    const imageUrls = (req.files as Express.Multer.File[]).map((file) => file.path);
    company.portfolio = [...(company.portfolio || []), ...imageUrls];
    await company.save();

    res.status(200).json({ message: "Portfolio Sync Successful", portfolio: company.portfolio });
  } catch (error) {
    console.error('Portfolio upload error:', error);
    res.status(500).json({ message: "Portfolio upload failed" });
  }
};

export const deleteCompanyPortfolioImage = async (req: any, res: Response) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: "Image URL is required" });

    const company = await getAuthorizedCompany(req, req.params.slug);
    if (!company) return res.status(403).json({ message: "Unauthorized update attempt." });

    company.portfolio = (company.portfolio || []).filter((url) => url !== imageUrl);
    await company.save();

    res.status(200).json({ message: "Image removed from portfolio", portfolio: company.portfolio });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove image" });
  }
};
// @desc    Update company profile using JWT companyId (no slug needed — safe for new accounts)
export const updateMyCompanyProfile = async (req: any, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ message: 'No company linked to this account.' });

    const allowed = ['phone', 'website', 'sector', 'address', 'city', 'country', 'email'];
    const update: Record<string, any> = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) update[field] = req.body[field]; });

    const company = await Company.findByIdAndUpdate(companyId, update, { new: true });
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    res.status(200).json({ message: 'Profile updated.', company });
  } catch {
    res.status(500).json({ message: 'Profile update failed.' });
  }
};

// @desc    Forgot Password - Issue reset token
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email.' });

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, type: 'password_reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: 'Password reset token issued. Check your email.', 
      resetToken // In production, send this via email
    });
  } catch (error) {
    res.status(500).json({ message: 'Forgot password request failed.' });
  }
};

// @desc    Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: 'New password is required.' });

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid token type.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed.' });
  }
};
