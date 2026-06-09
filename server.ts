import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy load Gemini Client to handle cases where GEMINI_API_KEY is not defined at boot.
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// REST API endpoint for requirements generation
app.post("/api/generate-requirements", async (req, res) => {
  try {
    const { inputText, systemInstruction, userPrompt, targetAudience } = req.body;

    if (!inputText) {
      res.status(400).json({ error: "Input minutes text is required." });
      return;
    }

    const ai = getGeminiClient();
    
    // Construct the prompt with target audience guidance to strictly follow the requested structure
    const fullPrompt = `${userPrompt || "Generate requirements definition document based on the style below:"}
    
Target Reader: ${targetAudience || "病院安全管理委員会セキュリティ監査チーム"}

Please process the following Input Data:
---
${inputText}
---`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction || "You are a senior IT architect and security designer specializing in medical AI systems.",
        temperature: 0.2, // low temperature for precise, fact-based extraction
      },
    });

    const outputText = response.text || "";
    res.json({ outputText });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate requirements definition." });
  }
});

// A mini-backend helper for interactive security simulation (to give Tobias concrete value)
// We provide a patient data masking simulator endpoint.
app.post("/api/simulator/mask", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required to mask." });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = 
      "You are a strict PII and PHI (Protected Health Information) masking utility for Japanese hospital records. " +
      "Identify all patient names, dates of birth, doctor names, phone numbers, addresses, and ID numbers. " +
      "Mask them replacing with [匿名化済み_氏名], [匿名化済み_日時], [匿名化済み_ID], etc. " +
      "Keep all medical context. Output ONLY the masked text.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    res.json({ maskedText: response.text || "" });
  } catch (error: any) {
    console.error("Masking simulation error:", error);
    res.status(500).json({ error: error.message || "Failed to mask text." });
  }
});

// Vite middleware flow
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MEDISIS Backend running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Error starting MEDISIS server:", err);
});
