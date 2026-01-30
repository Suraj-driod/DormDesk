import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Create a generic base64 string
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || "image/jpeg", // Fallback mime type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const scanIdCard = async (file) => {
  try {
    if (!API_KEY) {
      console.error("❌ Missing VITE_GEMINI_API_KEY in .env file");
      alert("API Key missing! Check console.");
      return null;
    }

    // Use gemini-1.5-flash for speed
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Stricter prompt to enforce JSON only
    const prompt = `
      You are a data extraction engine. Analyze this ID card image. 
      Extract the "fullName" and "email" ONLY.
      
      Return a JSON object strictly in this format:
      {
        "fullName": "John Doe",
        "email": "john@example.com"
      }

      Rules:
      1. If the email is not visible, try to infer it from the name or ID number if standard formats exist, otherwise return an empty string.
      2. If the name is all caps, convert it to Title Case (e.g., JOHN DOE -> John Doe).
      3. Do NOT return markdown formatting (no \`\`\`json). Just the raw JSON string.
    `;

    console.log("🤖 Sending image to Gemini...");
    const imagePart = await fileToGenerativePart(file);
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 Raw AI Response:", text);

    // Robust JSON extraction: Find the substring between the first '{' and last '}'
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("❌ No JSON object found in AI response.");
      return null;
    }

    const cleanJson = jsonMatch[0];
    const parsedData = JSON.parse(cleanJson);
    
    console.log("✅ Parsed Data:", parsedData);
    return parsedData;

  } catch (error) {
    console.error("❌ OCR Scan Failed:", error);
    return null;
  }
};