import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Gemini intermittently returns 503 "model is overloaded / high demand" — these
 * are transient. Retry a few times with backoff before giving up.
 */
async function generateWithRetry(model: any, prompt: string, attempts = 3): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || "");
      const retryable = /503|overload|high demand|Service Unavailable|ECONNRESET|fetch failed/i.test(msg);
      if (!retryable || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 900 * (i + 1))); // 0.9s, 1.8s
    }
  }
  throw lastErr;
}

export interface BOQRateSuggestion {
  rate: number;
  unit: string;
  justification: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Suggest a market rate for a construction BOQ item using Gemini.
 * Returns rate, unit, a short justification, and a confidence level.
 */
export interface ReferencePrice {
  name: string;
  price: number;
  unit: string;
  supplier?: string;
}

export interface PastCorrection {
  description: string;
  aiSuggestedRate: number;
  finalRate: number;
  location?: string;
}

export const suggestBOQRate = async (
  description: string,
  category: string,
  location?: string,
  referencePrices: ReferencePrice[] = [],
  pastCorrections: PastCorrection[] = []
): Promise<BOQRateSuggestion> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const locationLine = location
    ? `Estimate the rate for this specific location: "${location}". Account for local
       market conditions, transport, and import costs in that region.`
    : `Estimate a general market rate for Africa.`;

  const referenceLine = referencePrices.length
    ? `Use these real marketplace prices (in USD) as your primary anchor; only
       deviate if the item clearly differs:\n` +
      referencePrices
        .map((p) => `- ${p.name}: ${p.price} per ${p.unit}${p.supplier ? ` (${p.supplier})` : ''}`)
        .join('\n')
    : '';

  // Learning loop: the user's own past corrections steer future estimates
  const correctionLine = pastCorrections.length
    ? `This user previously corrected your estimates for similar items — weight these heavily:\n` +
      pastCorrections
        .map((c) => `- "${c.description}"${c.location ? ` (${c.location})` : ''}: you suggested ${c.aiSuggestedRate}, they used ${c.finalRate}`)
        .join('\n')
    : '';

  const prompt = `
    Act as a construction cost estimator.
    ${locationLine}
    ${referenceLine}
    ${correctionLine}
    Analyze this item: "${description}" in category "${category}".
    Provide a suggested market rate (number, no currency symbol), the unit of
    measure, a brief one-sentence justification (mention the location if given),
    and your confidence in the estimate.
    When marketplace reference prices are given, set confidence to "high".

    Set "confidence" to:
      - "high" if this is a common, standardised item with stable pricing
      - "medium" if pricing varies by supplier or region
      - "low" if the item is vague, specialised, or hard to price without specs

    Return ONLY JSON in this exact shape:
    { "rate": number, "unit": string, "justification": string, "confidence": "high" | "medium" | "low" }
  `;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await generateWithRetry(model, prompt);
  const parsed = JSON.parse(result.response.text() || "{}");

  // Normalise / guard the response
  const confidence = ["high", "medium", "low"].includes(parsed.confidence)
    ? parsed.confidence
    : "low";

  return {
    rate: Number(parsed.rate) || 0,
    unit: parsed.unit || "unit",
    justification: parsed.justification || "No justification provided.",
    confidence,
  };
};

<<<<<<< HEAD
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

=======
/* ------------------------------------------------------------------ */
/* WHOLE-BOQ ANALYSIS: missing items / duplicates / alternatives /    */
/* price outliers                                                     */
/* ------------------------------------------------------------------ */

export interface BOQItemInput {
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

export type SuggestionType = "missing" | "duplicate" | "alternative" | "outlier";

export interface BOQSuggestion {
  type: SuggestionType;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  relatedItems?: string[]; // descriptions of existing items this refers to
  item?: BOQItemInput;     // an addable item (for missing / alternative)
}

const VALID_TYPES: SuggestionType[] = ["missing", "duplicate", "alternative", "outlier"];

/**
 * Review an entire BOQ and surface missing complementary items, duplicates,
 * cheaper marketplace alternatives, and price outliers.
 */
export const analyzeBOQ = async (
  items: BOQItemInput[],
  location?: string,
  referencePrices: ReferencePrice[] = []
): Promise<BOQSuggestion[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }
  if (!items.length) return [];

  const itemList = items
    .map((it, i) => `${i + 1}. ${it.description} — ${it.qty} ${it.unit} @ ${it.rate}`)
    .join("\n");

  const referenceLine = referencePrices.length
    ? `Marketplace catalogue (prices in USD), use for alternatives and outlier checks:\n` +
      referencePrices
        .map((p) => `- ${p.name}: ${p.price} per ${p.unit}${p.supplier ? ` (${p.supplier})` : ""}`)
        .join("\n")
    : "";

  const prompt = `
    Act as a quantity surveyor reviewing a Bill of Quantities${location ? ` for a project in ${location}` : ""}.

    BOQ items (number. description — qty unit @ rate):
    ${itemList}

    ${referenceLine}

    Review the BOQ and return concrete, high-value suggestions only. Look for:
    - "missing": complementary items clearly required but absent (e.g. concrete without rebar/aggregate).
    - "duplicate": items that appear to be the same thing entered more than once.
    - "alternative": a cheaper marketplace product that could substitute an item.
    - "outlier": a rate that is far from the marketplace/regional norm.

    For "missing" and "alternative", include an "item" object the user can add directly.
    Reference existing items by their description in "relatedItems" where relevant.
    Be conservative — do not invent problems. Return at most 8 suggestions.

    Return ONLY JSON in this exact shape:
    {
      "suggestions": [
        {
          "type": "missing" | "duplicate" | "alternative" | "outlier",
          "severity": "high" | "medium" | "low",
          "title": string,
          "detail": string,
          "relatedItems": string[],
          "item": { "description": string, "unit": string, "qty": number, "rate": number }
        }
      ]
    }
  `;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await generateWithRetry(model, prompt);
  const parsed = JSON.parse(result.response.text() || "{}");
  const raw = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  // Validate / normalise each suggestion
  return raw
    .filter((s: any) => VALID_TYPES.includes(s?.type))
    .slice(0, 8)
    .map((s: any) => ({
      type: s.type,
      severity: ["high", "medium", "low"].includes(s.severity) ? s.severity : "medium",
      title: String(s.title || "Suggestion"),
      detail: String(s.detail || ""),
      relatedItems: Array.isArray(s.relatedItems) ? s.relatedItems.map(String).slice(0, 5) : [],
      item:
        s.item && s.item.description
          ? {
              description: String(s.item.description),
              unit: String(s.item.unit || "unit"),
              qty: Number(s.item.qty) || 1,
              rate: Number(s.item.rate) || 0,
            }
          : undefined,
    }));
};

/* ------------------------------------------------------------------ */
/* CONVERSATIONAL BOQ GENERATION: turn a free-text brief into a full  */
/* draft Bill of Quantities anchored to marketplace reference prices  */
/* ------------------------------------------------------------------ */

export interface GeneratedItem {
  description: string;
  unit: string;
  qty: number;
  rate: number;
  category: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Generate a complete draft BOQ from a free-text construction brief.
 * Returns a short summary plus 8–20 realistic line items with USD rates,
 * anchored to the supplied marketplace reference prices where they match.
 */
export const generateBOQ = async (
  brief: string,
  location?: string,
  referencePrices: ReferencePrice[] = []
): Promise<{ items: GeneratedItem[]; summary: string }> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const locationLine = location
    ? `The project is located in: "${location}". Use realistic market rates for that
       region, accounting for local labour, transport, and import costs.`
    : `Assume a general African market for rates.`;

  const referenceLine = referencePrices.length
    ? `Use these real marketplace prices (in USD) as your primary anchor for any matching
       items; only deviate when an item clearly differs:\n` +
      referencePrices
        .map((p) => `- ${p.name}: ${p.price} per ${p.unit}${p.supplier ? ` (${p.supplier})` : ""}`)
        .join("\n")
    : "";

  const prompt = `
    Act as an experienced quantity surveyor.
    ${locationLine}
    ${referenceLine}

    A client has given you this construction brief:
    "${brief}"

    Produce a realistic draft Bill of Quantities — the major material and work line
    items needed to deliver this brief. For each line item give a sensible quantity,
    a unit of measure, and a market RATE IN USD (number only, no currency symbol) for
    the given location. Group items with a short category (e.g. "Substructure",
    "Concrete", "Blockwork", "Roofing", "Finishes", "Plumbing", "Electrical").
    Keep it to roughly 8 to 20 line items covering the whole job.

    Set "confidence" per item to:
      - "high" if anchored to a marketplace reference price or a common standardised item
      - "medium" if pricing varies by supplier or region
      - "low" if the item is vague or hard to price without specs

    Return ONLY JSON in this exact shape:
    {
      "summary": string,
      "items": [
        { "description": string, "unit": string, "qty": number, "rate": number, "category": string, "confidence": "high" | "medium" | "low" }
      ]
    }
  `;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await generateWithRetry(model, prompt);
  const parsed = JSON.parse(result.response.text() || "{}");
  const raw = Array.isArray(parsed.items) ? parsed.items : [];

  const items: GeneratedItem[] = raw
    .filter((it: any) => it && it.description && String(it.description).trim())
    .slice(0, 25)
    .map((it: any) => ({
      description: String(it.description).trim(),
      unit: String(it.unit || "unit"),
      qty: Number(it.qty) || 1,
      rate: Number(it.rate) || 0,
      category: String(it.category || "General"),
      confidence: ["high", "medium", "low"].includes(it.confidence) ? it.confidence : "medium",
    }));

  return {
    summary: String(parsed.summary || "Draft BOQ generated from your brief."),
    items,
  };
};

/* ---- Marketplace Intelligence (teammate) ---- */
>>>>>>> main
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

/* ---- Receipt AI parsing (from samdav) ---- */
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
