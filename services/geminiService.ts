
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PatientDataInput, PredictionOutput } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

// Ensure API_KEY is set in the environment variables
// The user of this app MUST set process.env.API_KEY
// For example, using a .env file and a bundler like Vite or Webpack,
// or by setting it directly in the deployment environment.
// const API_KEY = process.env.REACT_APP_GEMINI_API_KEY; // Example for Create React App
const API_KEY = process.env.API_KEY; // Standard Node.js way, ensure bundler handles this

if (!API_KEY) {
  console.error("Gemini API Key not found. Please set the API_KEY environment variable.");
  // Potentially throw an error or handle this state in the UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Use non-null assertion if confident it's set or handled

function formatPatientDataForPrompt(data: PatientDataInput): string {
  let prompt = "Patient Data:\n";
  prompt += `- Demographics: Age ${data.demographics.age}, Gender ${data.demographics.gender || 'N/A'}\n`; // Ethnicity removed
  prompt += `- Medical History: Diagnosis Codes (${data.medicalHistory.diagnosisCodes || 'N/A'}), Previous Admissions ${data.medicalHistory.previousAdmissions || '0'}, Length of Last Stay ${data.medicalHistory.lengthOfStayDays || 'N/A'} days. Summary: ${data.medicalHistory.treatmentSummary || 'N/A'}\n`;
  prompt += `- Key Lab Results: ${data.labResults.keyLabResultsText || 'N/A'}\n`;
  prompt += `- Social Determinants: Support System (${data.socialDeterminants.hasSupportSystem || 'N/A'}), Housing (${data.socialDeterminants.housingSituation || 'N/A'})\n`;
  return prompt;
}

// Renamed from getPredictionResult to avoid potential reserved keyword issues in some contexts
export const 예측_결과_가져오기 = async (patientData: PatientDataInput): Promise<PredictionOutput> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Cannot make predictions.");
  }
  
  const model = GEMINI_TEXT_MODEL;
  const formattedData = formatPatientDataForPrompt(patientData);

  const prompt = `
    ${formattedData}
    Analyze this patient's profile for 30-day hospital readmission risk.
    Return your response STRICTLY as a JSON object matching this schema:
    {
      "riskPercentage": number (0-100, integer),
      "keyRiskDrivers": string[] (list of 2-4 concise factors),
      "proactiveRecommendations": string[] (list of 2-4 actionable recommendations)
    }

    Example JSON output:
    {
      "riskPercentage": 65,
      "keyRiskDrivers": ["History of multiple readmissions", "Poorly controlled diabetes", "Lack of social support"],
      "proactiveRecommendations": ["Schedule follow-up with PCP within 3 days of discharge", "Medication reconciliation by pharmacist", "Arrange home health nurse visit"]
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            // For this task, higher quality is preferred over extreme low latency.
            // thinkingConfig: { thinkingBudget: 0 } // Could be used if ultra-low latency was critical and model supported it well.
        }
    });

    let jsonStr = response.text.trim();
    // Remove Markdown code fences if present
    const fenceRegex = /^\`\`\`(?:json)?\s*\n?(.*?)\n?\s*\`\`\`$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    const parsedJson = JSON.parse(jsonStr);

    // Validate the structure of the parsed JSON (basic validation)
    if (typeof parsedJson.riskPercentage !== 'number' ||
        !Array.isArray(parsedJson.keyRiskDrivers) ||
        !Array.isArray(parsedJson.proactiveRecommendations)) {
      throw new Error('Invalid JSON response structure from Gemini API.');
    }
    
    return {
        riskPercentage: Math.max(0, Math.min(100, Math.round(parsedJson.riskPercentage))), // Ensure percentage is within 0-100
        keyRiskDrivers: parsedJson.keyRiskDrivers.map((driver: any) => String(driver)),
        proactiveRecommendations: parsedJson.proactiveRecommendations.map((rec: any) => String(rec)),
    };

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof Error && error.message.includes("API_KEY_INVALID")) {
        throw new Error("Invalid Gemini API Key. Please check your configuration.");
    }
    // Provide a fallback or more generic error for other issues
    throw new Error(`Failed to get prediction from AI model. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
};