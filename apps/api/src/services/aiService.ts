import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');

export const suggestBOQRate = async (description: string, category: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Act as a construction cost estimator in Africa.
    Analyze this item: "${description}" in category "${category}".
    Provide a suggested market rate, unit of measure, and a brief justification.
  `;

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      rate: { type: SchemaType.NUMBER },
      unit: { type: SchemaType.STRING },
      justification: { type: SchemaType.STRING }
    },
    required: ["rate", "unit", "justification"]
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    }
  });

  return JSON.parse(result.response.text() || '{}');
};

export const parseReceiptPrompt = async (promptText: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Act as an AI receipt generation assistant.
    Analyze the following user request and extract the necessary details to build a receipt.
    If some details are missing, use reasonable generic defaults (e.g. status: 'draft', quantity: 1) or leave them empty.

    USER REQUEST:
    "${promptText}"
  `;

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      clientName: { type: SchemaType.STRING },
      clientEmail: { type: SchemaType.STRING },
      clientPhone: { type: SchemaType.STRING },
      clientAddress: { type: SchemaType.STRING },
      status: { type: SchemaType.STRING, description: "draft, pending, or paid" },
      notes: { type: SchemaType.STRING },
      items: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            quantity: { type: SchemaType.NUMBER },
            rate: { type: SchemaType.NUMBER }
          },
          required: ["description", "quantity", "rate"]
        }
      }
    },
    required: ["clientName", "items"]
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    }
  });

  return JSON.parse(result.response.text() || '{}');
};

export const analyzeSupplierData = async (aggregatedData: any) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Act as an AI Marketplace Intelligence engine for construction materials in Africa.
    Analyze the following raw database statistics for a specific supplier and generate highly specific business insights.

    RAW DATA:
    ${JSON.stringify(aggregatedData)}
  `;

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      demandForecasting: {
        type: SchemaType.OBJECT,
        properties: {
          trend: { type: SchemaType.STRING, description: "up or down" },
          category: { type: SchemaType.STRING },
          region: { type: SchemaType.STRING },
          percentageIncrease: { type: SchemaType.NUMBER },
          timeframeDays: { type: SchemaType.NUMBER },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["trend", "category", "region", "percentageIncrease", "timeframeDays", "recommendation"]
      },
      regionalDemand: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            region: { type: SchemaType.STRING },
            topCategory: { type: SchemaType.STRING },
            insight: { type: SchemaType.STRING }
          },
          required: ["region", "topCategory", "insight"]
        }
      },
      searchIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          searches: { type: SchemaType.NUMBER },
          product: { type: SchemaType.STRING },
          timeframe: { type: SchemaType.STRING },
          supplierCount: { type: SchemaType.NUMBER },
          status: { type: SchemaType.STRING }
        },
        required: ["searches", "product", "timeframe", "supplierCount", "status"]
      },
      marketplaceOpportunity: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          status: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["category", "status", "recommendation"]
      },
      supplierSalesIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          topPerforming: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          lowPerforming: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topPerforming", "lowPerforming", "recommendations"]
      },
      priceIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          product: { type: SchemaType.STRING },
          region: { type: SchemaType.STRING },
          averageMarketPrice: { type: SchemaType.NUMBER },
          yourPrice: { type: SchemaType.NUMBER },
          differencePercentage: { type: SchemaType.NUMBER },
          status: { type: SchemaType.STRING, description: "above market average | below market average | at market average" }
        },
        required: ["product", "region", "averageMarketPrice", "yourPrice", "differencePercentage", "status"]
      },
      competitorIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          categories: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { name: { type: SchemaType.STRING }, trend: { type: SchemaType.STRING } },
              required: ["name", "trend"]
            }
          }
        },
        required: ["summary", "categories"]
      },
      leadQualityScoring: {
        type: SchemaType.OBJECT,
        properties: {
          recentLeads: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                buyer: { type: SchemaType.STRING },
                request: { type: SchemaType.STRING },
                score: { type: SchemaType.NUMBER },
                intent: { type: SchemaType.STRING, description: "High Intent | Medium Intent | Low Intent" }
              },
              required: ["buyer", "request", "score", "intent"]
            }
          }
        },
        required: ["recentLeads"]
      },
      trafficIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          mostTrafficRegions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          metrics: {
            type: SchemaType.OBJECT,
            properties: {
              productViews: { type: SchemaType.NUMBER },
              profileVisits: { type: SchemaType.NUMBER },
              whatsappClicks: { type: SchemaType.NUMBER },
              chatClicks: { type: SchemaType.NUMBER },
              rfqRequests: { type: SchemaType.NUMBER }
            },
            required: ["productViews", "profileVisits", "whatsappClicks", "chatClicks", "rfqRequests"]
          }
        },
        required: ["mostTrafficRegions", "metrics"]
      },
      buyerJourney: {
        type: SchemaType.OBJECT,
        properties: {
          dropOffPoint: { type: SchemaType.STRING },
          dropOffPercentage: { type: SchemaType.NUMBER },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["dropOffPoint", "dropOffPercentage", "recommendation"]
      },
      aiMarketing: {
        type: SchemaType.OBJECT,
        properties: {
          trend: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["trend", "recommendation"]
      },
      inventoryPrediction: {
        type: SchemaType.OBJECT,
        properties: {
          product: { type: SchemaType.STRING },
          daysRemaining: { type: SchemaType.NUMBER },
          recommendedRestock: { type: SchemaType.NUMBER }
        },
        required: ["product", "daysRemaining", "recommendedRestock"]
      },
      seasonalDemand: {
        type: SchemaType.OBJECT,
        properties: {
          product: { type: SchemaType.STRING },
          season: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["product", "season", "recommendation"]
      },
      marketplaceHealthScore: {
        type: SchemaType.OBJECT,
        properties: {
          score: { type: SchemaType.NUMBER },
          maxScore: { type: SchemaType.NUMBER },
          recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["score", "maxScore", "recommendations"]
      }
    },
    required: [
      "demandForecasting", "regionalDemand", "searchIntelligence", "marketplaceOpportunity",
      "supplierSalesIntelligence", "priceIntelligence", "competitorIntelligence", "leadQualityScoring",
      "trafficIntelligence", "buyerJourney", "aiMarketing", "inventoryPrediction", "seasonalDemand",
      "marketplaceHealthScore"
    ]
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    }
  });

  return JSON.parse(result.response.text() || '{}');
};

export const analyzeGlobalMarketplaceData = async (globalData: any) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Act as an AI Marketplace Intelligence engine for construction materials in Africa.
    Analyze the following raw database statistics for the marketplace administrator.

    RAW DATA:
    ${JSON.stringify(globalData)}
  `;

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      overview: {
        type: SchemaType.OBJECT,
        properties: {
          totalSuppliers: { type: SchemaType.NUMBER },
          totalProducts: { type: SchemaType.NUMBER },
          totalInquiries: { type: SchemaType.NUMBER },
          totalRFQs: { type: SchemaType.NUMBER },
          totalWhatsappClicks: { type: SchemaType.NUMBER },
          totalChatConversations: { type: SchemaType.NUMBER }
        },
        required: ["totalSuppliers", "totalProducts", "totalInquiries", "totalRFQs", "totalWhatsappClicks", "totalChatConversations"]
      },
      demandIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          fastestGrowing: { type: SchemaType.STRING },
          fastestDeclining: { type: SchemaType.STRING },
          highestDemandRegions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          supplierShortages: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["fastestGrowing", "fastestDeclining", "highestDemandRegions", "supplierShortages"]
      },
      growthOpportunities: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ["overview", "demandIntelligence", "growthOpportunities"]
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    }
  });

  return JSON.parse(result.response.text() || '{}');
};
