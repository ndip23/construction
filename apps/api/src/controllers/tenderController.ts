import { Request, Response } from 'express';
import Tender from '../models/Tender';
import Proposal from '../models/Proposal';

// @desc    Get all open tenders for the public board
export const getAllTenders = async (req: Request, res: Response) => {
  try {
    const tenders = await Tender.find({ status: 'Open' } as any)
      .sort({ createdAt: -1 })
      .populate('company', 'name logo');
    res.status(200).json(tenders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tender board" });
  }
};

/**
 * @desc    Get single tender by SLUG
 * @route   GET /api/v1/tenders/:slug
 */
export const getTenderBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Search by Slug (e.g., "kelly-modern-villa")
    const tender = await Tender.findOne({ slug } as any).populate('company', 'name logo');

    if (!tender) {
      return res.status(404).json({ message: "Tender not found" });
    }

    res.status(200).json(tender);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving project details" });
  }
};

// @desc    Post a new Tender (Client/Owner)
export const createTender = async (req: any, res: Response) => {
  try {
    const tender = new Tender({
      ...req.body,
      postedBy: req.user.id,
      company: req.user.companyId
    });
    await tender.save();
    res.status(201).json({ success: true, data: tender });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Broadcast a project from a Public Guest
 * @route   POST /api/v1/tenders/public
 */
export const createPublicTender = async (req: Request, res: Response) => {
  try {
    const { title, clientName, description, budget, location, whatsappNumber } = req.body;

    // 1. Validation Check: Ensure critical fields exist
    if (!title || !description || !budget || !whatsappNumber) {
      return res.status(400).json({ message: "Missing required project details." });
    }

    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);

    // 2. Create Object
    const newTender = new Tender({
      title,
      clientName,
      description,
      budget: Number(budget),
      location,
      whatsappNumber,
      deadline: defaultDeadline,
      status: 'Open',
      category: 'General Construction',
      isVerified: false 
    });

    // 3. Save to MongoDB
    await newTender.save();

    res.status(201).json({ 
      success: true,
      message: "Project Broadcasted Successfully!" 
    });

  } catch (error: any) {
    // This logs the specific reason it failed in your terminal
    console.error("CRITICAL DB ERROR:", error.message);
    res.status(500).json({ 
      message: "BuildHub infrastructure error during save.",
      error: error.message 
    });
  }
};

export const submitProposal = async (req: any, res: Response) => {
  try {
    const { id: slugOrId } = req.params; // This is 'modern' from your URL

    // 1. Find the tender by SLUG first (since that's what the frontend is sending)
    const tender = await Tender.findOne({ slug: slugOrId } as any);

    if (!tender) {
      return res.status(404).json({ message: "Project not found to bid on." });
    }

    // 2. Create the proposal using the real Tender ID
    const proposal = new Proposal({
      tender: tender._id, // Use the real database ID here
      company: req.user.companyId,
      user: req.user.id,
      bidAmount: Number(req.body.amount),
      timelineWeeks: Number(req.body.duration),
      coverLetter: req.body.coverLetter || "Professional bid submitted via BuildHub."
    });

    await proposal.save();

    // 3. Increment the bid counter on the tender
    tender.proposalsCount += 1;
    await tender.save();

    res.status(201).json({ 
      success: true, 
      message: "Bid secured in system." 
    });

  } catch (error: any) {
    console.error("BID SUBMISSION ERROR:", error.message);
    res.status(500).json({ 
      message: "Server error during submission", 
      error: error.message 
    });
  }
};