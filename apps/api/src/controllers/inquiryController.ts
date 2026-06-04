import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Inquiry from '../models/Inquiry';
import DirectoryActivity from '../models/DirectoryActivity';

// @desc    Get all inquiries for a company
// @route   GET /api/v1/inquiries
// @access  Protected
export const getInquiries = async (req: any, res: Response) => {
  try {
    const inquiries = await Inquiry.find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 });
    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inquiries" });
  }
};

// @desc    Update inquiry status
// @route   PUT /api/v1/inquiries/:id/status
// @access  Protected
export const updateInquiryStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(200).json(inquiry);
  } catch (error) {
    res.status(500).json({ message: "Error updating inquiry" });
  }
};

// @desc    Get stats (impressions, clicks, CTA rate) for a company
// @route   GET /api/v1/inquiries/stats
// @access  Protected
export const getInquiryStats = async (req: any, res: Response) => {
  try {
    const activities = await DirectoryActivity.find({ companyId: req.user.companyId });

    let impressions = 0;
    let clicks = 0;

    activities.forEach(activity => {
      if (activity.action === 'impression') impressions++;
      if (activity.action === 'whatsapp_click') clicks++;
    });

    const ctaRate = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";

    res.status(200).json({
      impressions,
      clicks,
      ctaRate: parseFloat(ctaRate)
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating stats" });
  }
};

// @desc    Submit a new inquiry (Public)
// @route   POST /api/v1/inquiries/submit
// @access  Public
export const submitInquiry = async (req: Request, res: Response) => {
  try {
    const { clientName, email, phone, message, location, companyId } = req.body;

    if (!clientName || !message || !companyId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const inquiry = new Inquiry({
      clientName,
      email,
      phone,
      message,
      location,
      companyId
    });

    await inquiry.save();

    res.status(201).json({ success: true, message: "Inquiry sent successfully" });
    res.status(500).json({ message: "Error submitting inquiry" });
  }
};

// @desc    Get AI Insights based on inquiries
// @route   GET /api/v1/inquiries/ai-insights
// @access  Protected
export const getAiInsights = async (req: any, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "AI not configured" });

    const inquiries = await Inquiry.find({ companyId: req.user.companyId }).limit(20).sort({ createdAt: -1 });
    const activities = await DirectoryActivity.find({ companyId: req.user.companyId });

    let impressions = 0;
    let clicks = 0;
    activities.forEach(a => {
      if (a.action === 'impression') impressions++;
      if (a.action === 'whatsapp_click') clicks++;
    });

    const inquiryData = inquiries.map(i => ({
      message: i.message,
      location: i.location,
      date: i.createdAt
    }));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert construction business analyst. Look at the following metrics and recent inquiries for a construction company.
Impressions: ${impressions}
Clicks (WhatsApp): ${clicks}
Total Inquiries: ${inquiries.length}
Recent Inquiries: ${JSON.stringify(inquiryData)}

Please provide a highly professional analysis in JSON format exactly like this:
{
  "ctaPerformance": {
    "title": "CTA Performance",
    "insight": "State one hard fact about their click-through rate (e.g., 'Only 2% of views convert to clicks. Needs a stronger cover image.'). Max 15 words."
  },
  "serviceOpportunities": {
    "title": "Missing Services",
    "insight": "Name 1 or 2 high-demand services requested in inquiries that aren't listed. Max 10 words."
  },
  "quickAdvice": {
    "title": "Action Plan",
    "insight": "Give one direct, punchy instruction to get more leads. Max 15 words."
  }
}
Return ONLY valid JSON without any markdown formatting blocks like \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    if (text.startsWith('\`\`\`')) text = text.replace(/\`\`\`/g, '').trim();

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Error generating AI insights" });
  }
};
