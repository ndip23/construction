import { config } from 'dotenv';
config({ path: '/home/rehack/Desktop/construction/apps/api/.env' });
import { analyzeSupplierData, analyzeGlobalMarketplaceData } from './src/services/aiService';

async function run() {
  try {
    console.log("Testing analyzeSupplierData...");
    const data = await analyzeSupplierData({
      productViews: 100,
      topSearches: [{_id: 'cement', count: 10}],
      regionalActivity: [{_id: 'Lagos', count: 5, categories: ['cement']}],
      interactions: [{_id: 'whatsapp_click', count: 2}],
      totalSupplierProducts: 5
    });
    console.log("Success! Data keys:", Object.keys(data));
  } catch (err) {
    console.error("Error in analyzeSupplierData:", err);
  }
}

run();
