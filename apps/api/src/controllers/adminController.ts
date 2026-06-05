import { Request, Response } from 'express';
import Company from '../models/Company';
import Invoice from '../models/Invoice';
import User from '../models/User';
import Tender from '../models/Tender';
import Settings from '../models/Settings';

// 1. Get all companies waiting for approval
export const getPendingCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching queue" });
  }
};

// 2. Approve or Reject a company
export const verifyCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const company = await Company.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json({ message: `Company is now ${status}`, company });
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
  }
};

// 3. Get Platform-wide stats
export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    // 1. Calculate Total Platform Volume (Sum of all PAID invoices across all companies)
    const volumeData = await Invoice.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const totalVolume = volumeData.length > 0 ? volumeData[0].total : 0;

    // 2. Run counts for other metrics
    const [companyCount, userCount, tenderCount] = await Promise.all([
      Company.countDocuments({ status: 'verified' }),
      User.countDocuments({}),
      Tender.countDocuments({ status: 'Open' })
    ]);

    res.status(200).json({
      totalMarketplaceVolume: totalVolume,
      activeCompanies: companyCount,
      totalUsers: userCount,
      liveTenders: tenderCount,
      systemHealth: "99.9%",
      latency: "38ms"
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics engine failure" });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    // Fetch real recent events
    const [recentCompanies, recentTenders] = await Promise.all([
      Company.find().sort({ createdAt: -1 }).limit(3),
      Tender.find().sort({ createdAt: -1 }).limit(2).populate('company', 'name')
    ]);

    const logs = [
      ...recentCompanies.map(c => ({
        message: `Network Entry: ${c.name} registered from ${c.city}`,
        timestamp: "Just Now",
        region: c.country,
        type: "Registration"
      })),
      ...recentTenders.map(t => ({
        message: `New Tender: ${t.title} published by ${(t.company as any)?.name || 'Private Client'}`,
        timestamp: "Recent",
        region: t.location,
        type: "Marketplace"
      }))
    ];

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Activity stream disconnected" });
  }
};

/**
 * @desc    Get all registered companies on the platform
 * @route   GET /api/v1/admin/companies
 */
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all companies
    // 2. Populate 'owner' to get the name of the person who registered
    const companies = await Company.find()
      .populate('owner', 'name email') 
      .sort({ createdAt: -1 });

    res.status(200).json(companies);
  } catch (error: any) {
    console.error("ADMIN ERROR (List Companies):", error.message);
    res.status(500).json({ message: "Failed to retrieve global company list." });
  }
};

/**
 * @desc    Get detailed platform analytics for charts
 * @route   GET /api/v1/admin/analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // 1. Calculate Total Platform Volume (Sum of all PAID invoices)
    const volumeData = await Invoice.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalVolume = volumeData.length > 0 ? volumeData[0].total : 0;

    // 2. Mock Monthly Data (In production, you'd aggregate by month)
    const monthlyData = [4000, 6000, 4500, 9000, 6500, 8000, 10000, 7000, 8500, 9500, 11000, 12000];

    // 3. Geographic distribution logic
    const regionalDistribution = [
      { region: "CEMAC", percentage: 70 },
      { region: "ECOWAS", percentage: 85 },
      { region: "EAC", percentage: 30 }
    ];

    res.status(200).json({
      totalVolume,
      growthRate: "+22%",
      monthlyData,
      regionalDistribution,
      latency: 42,
      aiLoad: 12
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process platform big data." });
  }
};

/**
 * @desc    Get Global Platform Settings
 * @route   GET /api/v1/admin/settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    // Find the first settings document, or create it if it doesn't exist
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load global config." });
  }
};

/**
 * @desc    Update Global Platform Settings
 * @route   PUT /api/v1/admin/settings
 */
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updatedSettings = await Settings.findOneAndUpdate({} as any, req.body, {
      new: true,
      upsert: true // Creates it if it's missing
    });
    res.status(200).json({ message: "Platform Rules Updated", settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ message: "Failed to save configuration." });
  }
};