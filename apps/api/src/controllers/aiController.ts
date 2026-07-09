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

If you do NOT have enough information, set "needsMoreInfo" to true and return a list of specific follow-up questions in "followUpQuestions". Keep the questions minimal and easy to answer (maximum 2-3 questions).
If you DO have enough information, set "needsMoreInfo" to false, leave "followUpQuestions" empty, and populate the "estimate" object.

The estimate MUST include:
- totalCost: Estimated total cost (number in the local currency).
- currency: Local currency code (e.g. XAF, NGN, KES, USD).
- materials: Array of estimated major materials (e.g., Cement, Sand, Gravel, Steel, Zinc) with names, quantities, and descriptions.
- laborCost: Estimated total labor cost (number in local currency).
- stages: Array of stages (e.g. Foundation, Masonry/Structure, Roofing, Finishes) with stage name, cost (number), and duration.
- projectDuration: Estimated overall duration (e.g. "3 months").
- recommendations: Array of budgeting and cost-saving tips.
- category: A single string representing the best matching directory filter category (e.g. "contractor", "architect", "engineer", "electrician", "plumber", "roofer", "painter").
- location: The city name (string) to be used for local filtering.

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "needsMoreInfo": boolean,
  "followUpQuestions": string[],
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

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will output only valid JSON matching your schema." }],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.2,
        responseMimeType: "application/json"
      },
    });

    console.log(`🤖 Gemini generating cost estimate...`);

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    // Parse to ensure it is valid JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error("❌ Failed to parse Gemini response as JSON:", text);
      return res.status(500).json({
        message: "Failed to parse estimate. Please try again.",
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