const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Robustly extracts and parses JSON from a string that might contain 
 * markdown backticks or other conversational text.
 */
function extractJSON(text: string) {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try to extract content between first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const cleaned = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(cleaned);
      } catch (innerError) {
        console.error("Failed to parse extracted JSON block:", cleaned);
        throw new Error("The AI returned a malformed JSON structure.");
      }
    }
    
    console.error("No JSON braces found in text:", text);
    throw new Error("The AI did not return a valid data object.");
  }
}

export async function generateCheatSheet(tool: string, query: string, model: string = "gemini-2.5-flash") {
  if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === '') {
    throw new Error("API Key is missing. Please add your VITE_GEMINI_API_KEY to the .env file.");
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `
    You are an expert Data Scientist and Data Analyst. 
    User Tool: ${tool}
    User Query: "${query}"

    TASK:
    Generate a highly accurate, "Ready-to-Run" cheat sheet entry for the requested topic in ${tool}.
    
    IMPORTANT RULES FOR EXAMPLES:
    - Every example must be COMPLETE and RUNNABLE immediately.
    - For R: Use built-in datasets like 'mtcars', 'iris', or 'diamonds'.
    - For Python: Use 'sns.load_dataset("tips")' or 'pd.DataFrame({...})' to create data first.
    - For SQL: Use a 'WITH' clause or 'VALUES' to create a temporary table so the query works without a real DB.
    - For Excel: Provide a clear instruction on the data setup (e.g., "Assuming data in A1:B10...").

    Generate a JSON response that follows this EXACT TypeScript interface:
    {
      "id": "ai_${Date.now()}_${Math.floor(Math.random() * 1000)}",
      "toolId": "${tool.toLowerCase()}",
      "category": "One of: Data I/O & Setup, Filtering & Sorting, Aggregation & Grouping, Merging & Joining, Data Cleaning & Logic, Text & Dates, Window Functions, Statistics & Math",
      "name": "Concise name (e.g. 'Read Excel with readxl' or 'Bar Chart with ggplot2')",
      "concept": "Explain the logic/standard behind this in 1-2 clear sentences.",
      "syntax": "The precise code syntax or formula",
      "explanation": "Brief context on parameters or best practices.",
      "examples": [
        {
          "title": "Basic usage (Ready-to-Run)",
          "code": "Full runnable code including data setup",
          "description": "Exactly what happens when this runs"
        },
        {
          "title": "Advanced case (Ready-to-Run)",
          "code": "Full runnable code including data setup",
          "description": "How this solves a more complex problem"
        }
      ]
    }

    Rules:
    1. ONLY return the RAW JSON object.
    2. Do NOT include markdown formatting or backticks.
    3. Ensure syntax is 100% correct for ${tool}.
  `;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
      }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return extractJSON(resultText);
  } catch (error: any) {
    console.error("[GeminiService] Error:", error);
    throw error;
  }
}

export async function refineCheatSheet(currentFormula: any, instruction: string, model: string = "gemini-2.5-flash") {
  if (!API_KEY) throw new Error("API Key is missing.");

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `
    You are an expert Data Scientist. 
    TASK: Update the following cheat sheet card based on the user's refinement instruction.
    
    CURRENT CARD:
    ${JSON.stringify(currentFormula, null, 2)}

    USER REFINEMENT INSTRUCTION:
    "${instruction}"

    REQUIREMENTS:
    1. Maintain the JSON structure. Return ONLY RAW JSON.
    2. Ensure examples remain "Ready-to-Run".
  `;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    if (!response.ok) throw new Error("Refinement failed.");
    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return extractJSON(resultText);
  } catch (error: any) {
    console.error("[GeminiService] Refinement Error:", error);
    throw error;
  }
}

export async function translateCode(sourceTool: string, targetTool: string, code: string, model: string = "gemini-2.5-flash") {
  if (!API_KEY) throw new Error("API Key is missing.");

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `
    You are an expert Data Scientist. 
    TASK: Translate the following code from ${sourceTool} into ${targetTool}.
    
    SOURCE CODE (${sourceTool}):
    """
    ${code}
    """

    Return a JSON object matching the Formula interface. No markdown.
  `;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    if (!response.ok) throw new Error("Translation failed.");
    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    return extractJSON(resultText);
  } catch (error: any) {
    console.error("[GeminiService] Translation Error:", error);
    throw error;
  }
}
