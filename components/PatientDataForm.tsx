
import React, { useState, useCallback } from 'react';
import { PatientDataInput } from '../types';
import { Button } from './common/Button';
import { Card } from './common/Card';

interface PatientDataFormProps {
  initialData: PatientDataInput;
  onSubmit: (data: PatientDataInput) => void;
  isLoading: boolean;
  onDataChange: (data: PatientDataInput) => void;
}

export const PatientDataForm: React.FC<PatientDataFormProps> = ({ initialData, onSubmit, isLoading, onDataChange }) => {
  const [formData, setFormData] = useState<PatientDataInput>(initialData);

  const handleChange = useCallback(<K extends keyof PatientDataInput, SK extends keyof PatientDataInput[K]>(
    section: K,
    key: SK,
    value: PatientDataInput[K][SK]
  ) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
      onDataChange(newData); // Propagate changes up
      return newData;
    });
  }, [onDataChange]);

  const handleSimpleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [sectionStr, keyStr] = name.split('.') as [string, string];
    
    const section = sectionStr as keyof PatientDataInput;
    const key = keyStr; 

    let processedValue: string | number | boolean = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
      if (isNaN(processedValue as number)) processedValue = ''; 
    } else if (name === 'socialDeterminants.hasSupportSystem') {
       processedValue = value; 
    }

    handleChange<typeof section, keyof PatientDataInput[typeof section]>(
      section,
      key as keyof PatientDataInput[typeof section], 
      processedValue as PatientDataInput[typeof section][keyof PatientDataInput[typeof section]] 
    );
  }, [handleChange]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const handleClearForm = () => {
    const clearedData: PatientDataInput = {
      demographics: { age: '', gender: '' },
      medicalHistory: { diagnosisCodes: '', previousAdmissions: '', lengthOfStayDays: '', treatmentSummary: '' },
      labResults: { keyLabResultsText: '' },
      socialDeterminants: { hasSupportSystem: '', housingSituation: '' },
    };
    setFormData(clearedData);
    onDataChange(clearedData);
  };

  const inputClass = "w-full p-2 bg-slate-50 dark:bg-dark-secondary border border-slate-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-text-primary placeholder-slate-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-text-secondary mb-1";
  const fieldsetClass = "p-4 border border-slate-300 dark:border-gray-700 rounded-lg";
  const legendClass = "text-lg font-semibold text-secondary dark:text-primary px-2";


  return (
    <Card title="Patient Data Input for Single Prediction">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Demographics */}
        <fieldset className={`${fieldsetClass} grid grid-cols-1 md:grid-cols-2 gap-4`}> {/* Changed md:grid-cols-3 to md:grid-cols-2 */}
          <legend className={legendClass}>Demographics</legend>
          <div>
            <label htmlFor="demographics.age" className={labelClass}>Age</label>
            <input type="number" name="demographics.age" id="demographics.age" value={formData.demographics.age} onChange={handleSimpleChange} className={inputClass} placeholder="e.g., 65" />
          </div>
          <div>
            <label htmlFor="demographics.gender" className={labelClass}>Gender</label>
            <select name="demographics.gender" id="demographics.gender" value={formData.demographics.gender} onChange={handleSimpleChange} className={inputClass}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {/* Ethnicity field removed
          <div>
            <label htmlFor="demographics.ethnicity" className={labelClass}>Ethnicity</label>
            <input type="text" name="demographics.ethnicity" id="demographics.ethnicity" value={formData.demographics.ethnicity} onChange={handleSimpleChange} className={inputClass} placeholder="e.g., Caucasian" />
          </div>
          */}
        </fieldset>

        {/* Medical History */}
        <fieldset className={`${fieldsetClass} space-y-4`}>
          <legend className={legendClass}>Medical History</legend>
          <div>
            <label htmlFor="medicalHistory.diagnosisCodes" className={labelClass}>Primary Diagnosis Codes (comma-separated)</label>
            <input type="text" name="medicalHistory.diagnosisCodes" id="medicalHistory.diagnosisCodes" value={formData.medicalHistory.diagnosisCodes} onChange={handleSimpleChange} className={inputClass} placeholder="e.g., I10, E11.9, J44.9" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="medicalHistory.previousAdmissions" className={labelClass}>Number of Previous Admissions (last 12 months)</label>
              <input type="number" name="medicalHistory.previousAdmissions" id="medicalHistory.previousAdmissions" value={formData.medicalHistory.previousAdmissions} onChange={handleSimpleChange} className={inputClass} placeholder="e.g., 2" />
            </div>
            <div>
              <label htmlFor="medicalHistory.lengthOfStayDays" className={labelClass}>Length of Last Stay (days)</label>
              <input type="number" name="medicalHistory.lengthOfStayDays" id="medicalHistory.lengthOfStayDays" value={formData.medicalHistory.lengthOfStayDays} onChange={handleSimpleChange} className={inputClass} placeholder="e.g., 7" />
            </div>
          </div>
          <div>
            <label htmlFor="medicalHistory.treatmentSummary" className={labelClass}>Brief Treatment Summary (Current Admission)</label>
            <textarea name="medicalHistory.treatmentSummary" id="medicalHistory.treatmentSummary" value={formData.medicalHistory.treatmentSummary} onChange={handleSimpleChange} rows={3} className={inputClass} placeholder="e.g., Treated for pneumonia with antibiotics..."></textarea>
          </div>
        </fieldset>
        
        {/* Lab Results */}
        <fieldset className={`${fieldsetClass} space-y-4`}>
          <legend className={legendClass}>Key Lab Results</legend>
          <div>
            <label htmlFor="labResults.keyLabResultsText" className={labelClass}>Notable Lab Values (e.g., HbA1c: 7.5%, Creatinine: 1.2 mg/dL)</label>
            <textarea name="labResults.keyLabResultsText" id="labResults.keyLabResultsText" value={formData.labResults.keyLabResultsText} onChange={handleSimpleChange} rows={3} className={inputClass} placeholder="Enter key lab results, one per line or comma separated"></textarea>
          </div>
        </fieldset>

        {/* Social Determinants */}
        <fieldset className={`${fieldsetClass} grid grid-cols-1 md:grid-cols-2 gap-4`}>
          <legend className={legendClass}>Social Determinants of Health</legend>
          <div>
            <label htmlFor="socialDeterminants.hasSupportSystem" className={labelClass}>Adequate Social Support System</label>
            <select name="socialDeterminants.hasSupportSystem" id="socialDeterminants.hasSupportSystem" value={formData.socialDeterminants.hasSupportSystem} onChange={handleSimpleChange} className={inputClass}>
              <option value="">Select Option</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="socialDeterminants.housingSituation" className={labelClass}>Housing Situation</label>
            <select name="socialDeterminants.housingSituation" id="socialDeterminants.housingSituation" value={formData.socialDeterminants.housingSituation} onChange={handleSimpleChange} className={inputClass}>
              <option value="">Select Situation</option>
              <option value="Stable">Stable</option>
              <option value="Unstable">Unstable</option>
              <option value="Homeless">Homeless</option>
            </select>
          </div>
        </fieldset>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Predicting...' : 'Predict Readmission Risk'}
          </Button>
           <Button type="button" onClick={handleClearForm} variant="secondary" className="w-full sm:w-auto">
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
};