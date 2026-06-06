import { Request, Response } from 'express';
import MarketplaceActivity from '../models/MarketplaceActivity';

// @desc    Track marketplace user activity
// @route   POST /api/marketplace/track
// @access  Public
export const trackActivity = async (req: Request, res: Response) => {
  try {
    const { action, region, city, metadata } = req.body;
    
    if (!action || !region || !city) {
      return res.status(400).json({ message: 'Missing required fields for tracking' });
    }

    const activity = new MarketplaceActivity({
      action,
      region,
      city,
      metadata
    });

    await activity.save();
    res.status(201).json({ message: 'Activity tracked successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate mock traffic (FOR TESTING PURPOSES ONLY)
// @route   POST /api/marketplace/mock-traffic
// @access  Protected (Admin/Testing)
export const generateMockTraffic = async (req: Request, res: Response) => {
  try {
    const actions = ['product_view', 'search', 'whatsapp_click', 'chat_click', 'rfq_request'];
    const regions = ['Douala', 'Yaoundé', 'Bafoussam', 'Buea', 'Northern Cameroon'];
    const categories = ['Cement', 'Roofing materials', 'Steel reinforcement bars', 'Interlocking paving stones', 'Waterproofing materials', 'Solar products'];
    
    // Clear existing to avoid infinite growth during testing
    await MarketplaceActivity.deleteMany({});
    
    const mockData = [];
    for (let i = 0; i < 200; i++) {
      const isSearch = Math.random() > 0.2;
      const action = isSearch ? 'search' : actions[Math.floor(Math.random() * actions.length)];
      
      mockData.push({
        action,
        region: regions[Math.floor(Math.random() * regions.length)],
        city: 'Mock City',
        metadata: {
          category: categories[Math.floor(Math.random() * categories.length)],
          searchTerm: isSearch ? categories[Math.floor(Math.random() * categories.length)] : undefined,
          productName: !isSearch ? categories[Math.floor(Math.random() * categories.length)] : undefined,
        },
        // Spread dates over the last 30 days
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      });
    }

    await MarketplaceActivity.insertMany(mockData);

    res.status(201).json({ message: `Successfully injected ${mockData.length} mock activity records.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
