
export interface PatientDemographicsInput {
  age: number | string; // Allow string for form input
  gender: 'Male' | 'Female' | 'Other' | '';
  // ethnicity: string; // Removed
}

export interface MedicalHistoryInput {
  diagnosisCodes: string;
  previousAdmissions: number | string; // Allow string for form input
  lengthOfStayDays: number | string; // Allow string for form input
  treatmentSummary: string;
}

export interface SocialDeterminantsInput {
  hasSupportSystem: '' | 'Yes' | 'No'; // Adjusted for select
  housingSituation: 'Stable' | 'Unstable' | 'Homeless' | '';
}

export interface LabResultInput { // Simplified to a text area for "key lab results"
  keyLabResultsText: string;
}

export interface PatientDataInput {
  demographics: PatientDemographicsInput;
  medicalHistory: MedicalHistoryInput;
  labResults: LabResultInput; 
  socialDeterminants: SocialDeterminantsInput;
}

// Stored/Processed Patient Data (after validation/conversion)
export interface PatientDemographics {
  age: number;
  gender: 'Male' | 'Female' | 'Other' | '';
  // ethnicity: string; // Removed
}

export interface MedicalHistory {
  diagnosisCodes: string[]; // Parsed from comma-separated string
  previousAdmissions: number;
  lengthOfStayDays: number;
  treatmentSummary: string;
}

export interface SocialDeterminants {
  hasSupportSystem: boolean | null;
  housingSituation: 'Stable' | 'Unstable' | 'Homeless' | '';
}

export interface LabResult {
   keyLabResultsText: string; // Storing as is for simplicity to pass to Gemini
}

export interface ProcessedPatientData {
  demographics: PatientDemographics;
  medicalHistory: MedicalHistory;
  labResults: LabResult;
  socialDeterminants: SocialDeterminants;
}
export interface PatientData {
  id: string; // Unique identifier
  data: PatientDataInput; // The raw input data
  processedData?: ProcessedPatientData; // Optional processed version
}


export interface PredictionOutput {
  riskPercentage: number;
  keyRiskDrivers: string[];
  proactiveRecommendations: string[];
}

export type AppTab = 'single' | 'batch' | 'dashboard';

// For charts
export interface AgeDistributionData {
  ageGroup: string;
  count: number;
  readmitted: number;
}

export interface DiagnosisDistributionData {
  diagnosis: string; // or code
  count: number;
  readmitted: number;
}

export interface LengthOfStayData {
  status: string; // 'Readmitted' | 'Not Readmitted'
  averageDays: number;
}

// Voice Assistant Types
export type VoiceCommandAction = 
  | 'NAVIGATE'
  | 'FILL_FIELD'
  | 'SUBMIT_FORM'
  | 'CLEAR_FORM'
  | 'TOGGLE_THEME'
  | 'READ_PREDICTION'
  | 'TOGGLE_VOICE_ASSISTANT'
  | 'UNKNOWN';

export interface VoiceCommand {
  action: VoiceCommandAction;
  target?: string; // e.g., tab name, field name
  value?: string | number; // e.g., form field value
}

export type VoiceAssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'disabled';

export interface VoiceRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}