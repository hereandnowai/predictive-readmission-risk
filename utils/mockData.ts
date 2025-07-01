
import { PatientData, PredictionOutput, PatientDataInput } from '../types';

let patientIdCounter = 0;

export const generateMockPatient = (): PatientData => {
  patientIdCounter++;
  const id = `MOCK_${Date.now()}_${patientIdCounter}`;
  const mockInputData: PatientDataInput = {
    demographics: {
      age: Math.floor(Math.random() * 60 + 20).toString(), // Age between 20-80
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      // ethnicity: ['Caucasian', 'African American', 'Hispanic', 'Asian'][Math.floor(Math.random() * 4)], // Removed
    },
    medicalHistory: {
      diagnosisCodes: ['I10', 'E11.9', 'J45', 'M54.5'][Math.floor(Math.random() * 4)] + (Math.random() > 0.5 ? `, ${['I25.1', 'N18.3'][Math.floor(Math.random()*2)]}` : ''),
      previousAdmissions: Math.floor(Math.random() * 3).toString(),
      lengthOfStayDays: Math.floor(Math.random() * 10 + 3).toString(),
      treatmentSummary: `Patient treated for ${['pneumonia', 'CHF exacerbation', 'COPD exacerbation'][Math.floor(Math.random()*3)]}. Responded well to treatment. Discharged with follow-up instructions.`,
    },
    labResults: {
      keyLabResultsText: `HbA1c: ${(Math.random() * 5 + 5).toFixed(1)}%\nCreatinine: ${(Math.random() * 1 + 0.5).toFixed(1)} mg/dL\nBNP: ${Math.floor(Math.random() * 500 + 100)} pg/mL`,
    },
    socialDeterminants: {
      hasSupportSystem: Math.random() > 0.3 ? 'Yes' : 'No',
      housingSituation: ['Stable', 'Unstable'][Math.floor(Math.random() * 2)] as 'Stable' | 'Unstable',
    },
  };
  return { id, data: mockInputData };
};

export const generateMockPredictionOutput = (): PredictionOutput => {
  const riskPercentage = Math.floor(Math.random() * 80 + 10); // Risk between 10-90%
  return {
    riskPercentage: riskPercentage,
    keyRiskDrivers: [
      `Previous hospitalizations (${Math.floor(Math.random() * 3)})`,
      `Chronic condition (${['Diabetes', 'Heart Failure', 'COPD'][Math.floor(Math.random() * 3)]})`,
      riskPercentage > 60 ? 'Limited social support' : 'Medication non-adherence risk',
    ].slice(0, Math.floor(Math.random() * 2 + 2)), // 2 to 3 drivers
    proactiveRecommendations: [
      'Ensure follow-up appointment within 7 days post-discharge.',
      'Medication reconciliation and patient education.',
      riskPercentage > 50 ? 'Consider home health referral.' : 'Provide clear discharge instructions and teach-back.',
      'Dietary counseling referral if applicable.',
    ].slice(0, Math.floor(Math.random() * 2 + 2)), // 2 to 3 recommendations
  };
};