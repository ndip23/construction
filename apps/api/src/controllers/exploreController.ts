import { Request, Response } from 'express';
import Company from '../models/Company';
import Service from '../models/Service';
import DirectoryActivity from '../models/DirectoryActivity';

/**
 * @desc    Get all verified companies for the public directory
 * @route   GET /api/v1/explore/companies
 */

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const { service, city } = req.query;

    // 1. Base Filter: Show all companies (verified and pending)
    let filter: any = { }; 

    // 2. SEARCH LOGIC: company name, sector, or linked public services
    if (service) {
      const serviceRegex = { $regex: service as string, $options: 'i' };
      const companiesWithService = await Service.distinct('company', {
        isPublic: true,
        $or: [{ name: serviceRegex }, { category: serviceRegex }, { description: serviceRegex }],
      });
      filter.$or = [
        { name: serviceRegex },
        { sector: serviceRegex },
        { _id: { $in: companiesWithService } },
      ];
    }

    // 3. LOCATION LOGIC: Search by City
    if (city) {
      filter.city = { $regex: city as string, $options: 'i' };
    }

    // 4. DATABASE QUERY
    const companies = await Company.find(filter)
      .select('name slug city country logo services rating status createdAt portfolio phone') // Kept logo and added portfolio and phone
      .sort({ createdAt: -1 })
      .lean();

    // Fetch up to 3 public services for each company
    const companyIds = companies.map((c: any) => c._id);
    const publicServices = await Service.find({ company: { $in: companyIds }, isPublic: true })
      .select('name company')
      .lean();

    const servicesByCompany = publicServices.reduce((acc: any, service: any) => {
      const compId = service.company.toString();
      if (!acc[compId]) acc[compId] = [];
      if (acc[compId].length < 3) acc[compId].push(service);
      return acc;
    }, {});

    const enrichedCompanies = companies.map((company: any) => ({
      ...company,
      offeredServices: servicesByCompany[company._id.toString()] || []
    }));

    res.status(200).json(enrichedCompanies);

  } catch (error) {
    console.error("Explore Controller Error:", error);
    res.status(500).json({ message: "Failed to load directory data." });
  }
};

/**
 * @desc    Get a specific company's public profile by its slug
 * @route   GET /api/v1/explore/company/:slug
 */
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Find company by slug and hide sensitive internal fields
    const company = await Company.findOne({ slug })
      .select('-owner -updatedAt -__v');

    if (!company) {
      return res.status(404).json({ message: "Professional profile not found." });
    }

    const offeredServices = await Service.find({ company: company._id, isPublic: true })
      .sort({ createdAt: -1 })
      .select('name category description image priceFrom priceTo unit createdAt');

    res.status(200).json({ ...company.toObject(), offeredServices });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving profile details." });
  }
};

/**
 * @desc    Get company public profile by SLUG (any status — used for preview links)
 * @route   GET /api/v1/explore/company/:slug/preview
 */
export const getCompanyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const company = await Company.findOne({ slug })
      .select('-owner -updatedAt -__v');

    if (!company) {
      return res.status(404).json({ message: "Professional profile not found." });
    }

    const offeredServices = await Service.find({ company: company._id, isPublic: true })
      .sort({ createdAt: -1 })
      .select('name category description image priceFrom priceTo unit createdAt');

    res.status(200).json({ ...company.toObject(), offeredServices });
  } catch {
    res.status(500).json({ message: "Infrastructure error retrieving profile." });
  }
};

/**
 * @desc    Track public directory interactions
 * @route   POST /api/v1/explore/track
 */
export const trackDirectoryActivity = async (req: Request, res: Response) => {
  try {
    const { action, targetCompanyId, metadata } = req.body;
    
    if (!action || !targetCompanyId) {
      return res.status(400).json({ message: "Missing required tracking fields." });
    }

    const activity = new DirectoryActivity({
      action,
      companyId: targetCompanyId,
      metadata
    });

    await activity.save();

    // --- PAY-PER-CLICK DEDUCTION ---
    if (action === 'click') {
      const company = await Company.findById(targetCompanyId);
      if (company) {
        const FALLBACK: Record<string, number> = {
          XAF: 600, XOF: 600, NGN: 1600, GHS: 15, KES: 130, ZAR: 19, EGP: 48, USD: 1, EUR: 0.92, GBP: 0.79,
        };
        const currency = (company as any).currency || (company as any).countryCode || 'XAF';
        const rate = FALLBACK[currency] || 600;
        const deductionAmountLocal = Math.ceil(0.50 * rate);

        (company as any).walletBalance = ((company as any).walletBalance || 0) - 0.50;
        (company as any).walletHistory = (company as any).walletHistory || [];
        (company as any).walletHistory.push({
          type: 'debit',
          amount: deductionAmountLocal,
          amountUSD: 0.50,
          currency: currency,
          note: 'Directory Lead Profile View (PPC)',
          date: new Date(),
        } as any);

        await company.save();
      }
    }

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error tracking directory activity" });
  }
};