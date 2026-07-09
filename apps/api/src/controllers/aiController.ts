import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sanitizePrompt } from "../utils/promptGuard";

export const askAssistant = async (req: any, res: Response) => {
  try {
    const { history, context } = req.body;
    const { role, name } = req.user;

    // Guard the user message before it reaches the model
    const message = sanitizePrompt(req.body.message, 4000);
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "Missing GEMINI_API_KEY in .env",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // SYSTEM PROMPT
    const systemPrompt = `
You are BuildHub AI, a construction ERP expert for Africa.

User: ${name}
Role: ${role}
Context: ${
      context === "engineering-technical"
        ? "Engineering/Site"
        : "Business"
    }

Rules:
- Be professional
- Use metric units
- Give concise technical answers
- Refer to Marketplace for prices
`;

    // MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // HISTORY FORMAT
    const safeHistory = Array.isArray(history) ? history : [];

    const formattedHistory = safeHistory.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: sanitizePrompt(m.content, 4000) }],
    }));

    // START CHAT
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood." }],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    console.log(`🤖 Gemini processing for: ${name}`);

    // SEND MESSAGE
    const result = await chat.sendMessage(message);

    const response = await result.response;

    const text = response.text();

    return res.status(200).json({
      response: text,
    });
  } catch (error: any) {
    console.error("❌ GEMINI ERROR:", error);

    return res.status(500).json({
      message: "BuildHub AI is currently unavailable.",
      error: error.message,
    });
  }
};

/**
 * Attempt to repair truncated JSON by closing unclosed brackets and braces.
 * This handles the common case where Gemini's response is cut off mid-output.
 */
const tryRepairJSON = (raw: string): any | null => {
  let text = raw.trim();

  // Strip markdown fences if present
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  // First attempt: try parsing as-is
  try {
    return JSON.parse(text);
  } catch (_) {
    // continue to repair
  }

  // Remove any trailing comma before we close brackets
  text = text.replace(/,\s*$/, "");

  // Count unclosed brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of text) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // If we're inside a string, close it
  if (inString) {
    text += '"';
  }

  // Remove any trailing incomplete key-value (e.g. `"name": "Cem`)
  // by ensuring the last token is a complete value
  text = text.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, "");
  text = text.replace(/,\s*$/, "");

  // Close unclosed brackets and braces
  for (let i = 0; i < openBrackets; i++) text += "]";
  for (let i = 0; i < openBraces; i++) text += "}";

  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

export const generateEstimate = async (req: any, res: Response) => {
  try {
    const { history, message } = req.body;

    const userMessage = sanitizePrompt(message, 4000);
    if (!userMessage) {
      return res.status(400).json({ message: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: "Missing GEMINI_API_KEY in .env",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
You are Cpromark AI, an expert construction cost estimator for the African market (especially Cameroon, Nigeria, Kenya, etc.).
Analyze the user's project description and conversation history to determine if you have enough details to generate a cost estimate.

To generate a valid cost estimate, you need:
1. Location (city and/or country, e.g. Douala/Cameroon, Lagos/Nigeria, Nairobi/Kenya). If location is not specified, you MUST ask for it.
2. Approximate size of the project (dimensions, square meters, number of floors, or number of rooms).
3. Type of project (e.g. residential house, commercial building, renovation, fencing, warehouse).

IMPORTANT – FOLLOW-UP QUESTION RULES:
- If you do NOT have enough information, set "needsMoreInfo" to true.
- Each follow-up question MUST include 3 to 4 suggested answers so the user can simply pick one.
- Use SIMPLE, everyday language. Most users are NOT builders — avoid jargon like "square meters" or "load-bearing".
- Instead of asking "What is the total floor area in sqm?", ask "How big is the building?" and suggest options like "Small (2-3 rooms)", "Medium (4-5 rooms)", "Large (6+ rooms)".
- For floors, suggest "Single storey (ground floor only)", "2 floors (duplex)", "3 floors", etc.
- For location, suggest common cities in the relevant country.
- Keep questions to a maximum of 2-3.
- The AI should do the heavy lifting — infer reasonable defaults and only ask what truly matters for the estimate.

If you DO have enough information, set "needsMoreInfo" to false, leave "followUpQuestions" as an empty array, and populate the "estimate" object.

IMPORTANT OUTPUT CONSTRAINTS – you MUST follow these to keep the response compact:
- materials: Return AT MOST 8 items. Keep each "description" under 12 words.
- stages: Return AT MOST 5 items. Keep stage names short (2-4 words).
- recommendations: Return AT MOST 4 items. Keep each under 15 words.
- All string values must be concise. Do NOT write long paragraphs.

The estimate MUST include:
- totalCost: Estimated total cost (number in the local currency).
- currency: Local currency code (e.g. XAF, NGN, KES, USD).
- materials: Array of estimated major materials with names, quantities, and short descriptions.
- laborCost: Estimated total labor cost (number in local currency).
- stages: Array of stages with stage name, cost (number), and duration.
- projectDuration: Estimated overall duration (e.g. "3 months").
- recommendations: Array of budgeting and cost-saving tips.
- category: A single string representing the best matching directory filter category (e.g. "contractor", "architect", "engineer", "electrician", "plumber", "roofer", "painter").
- location: The city name (string) to be used for local filtering.

You MUST respond ONLY with a valid, complete JSON object matching this schema:
{
  "needsMoreInfo": boolean,
  "followUpQuestions": [
    { "question": string, "suggestions": string[] }
  ],
  "estimate": {
    "totalCost": number,
    "currency": string,
    "materials": [
      { "name": string, "quantity": string, "description": string }
    ],
    "laborCost": number,
    "stages": [
      { "stage": string, "cost": number, "duration": string }
    ],
    "projectDuration": string,
    "recommendations": string[],
    "category": string,
    "location": string
  } | null
}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const safeHistory = Array.isArray(history) ? history : [];

    const formattedHistory = safeHistory.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: sanitizePrompt(m.content, 4000) }],
    }));

    const generationConfig = {
      maxOutputTokens: 8000,
      temperature: 0.2,
      responseMimeType: "application/json" as const,
    };

    // Helper: attempt a single Gemini call and parse the result
    const attemptEstimate = async (attempt: number): Promise<any> => {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [{ text: "Understood. I will output only valid, compact JSON matching your schema." }],
          },
          ...formattedHistory,
        ],
        generationConfig,
      });

      console.log(`🤖 Gemini estimate attempt ${attempt}...`);

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      // Try direct parse first, then repair
      const parsed = tryRepairJSON(text);
      if (parsed) return parsed;

      // Log the raw text for debugging
      console.error(`❌ Attempt ${attempt} – unparseable response (${text.length} chars):`, text.slice(0, 500) + "...");
      return null;
    };

    // Attempt 1
    let parsedResult = await attemptEstimate(1);

    // Attempt 2 (automatic retry) if first attempt failed
    if (!parsedResult) {
      console.log("🔄 Retrying estimate generation...");
      parsedResult = await attemptEstimate(2);
    }

    if (!parsedResult) {
      return res.status(500).json({
        message: "The AI response was incomplete. Please try again with a simpler project description.",
      });
    }

    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("❌ ESTIMATOR ERROR:", error);
    return res.status(500).json({
      message: "Estimator AI is currently unavailable.",
      error: error.message,
    });
  }
};