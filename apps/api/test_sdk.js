require('dotenv').config({ path: '/home/rehack/Desktop/construction/apps/api/.env' });
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = "Act as an AI Marketplace Intelligence engine. Analyze data.";
  
  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      status: { type: SchemaType.STRING }
    },
    required: ["status"]
  };
  
  try {
    console.log("Generating content...");
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
