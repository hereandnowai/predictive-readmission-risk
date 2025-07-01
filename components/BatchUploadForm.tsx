
import React, { useState, useCallback } from 'react';
import { PatientData, PatientDataInput } from '../types';
import { Button } from './common/Button';
import { Card } from './common/Card';

// PapaParse is not used in the current implementation, comment out if not dynamically loaded.
// declare var Papa: any; 

interface BatchUploadFormProps {
  onUpload: (patients: PatientData[]) => void;
}

export const BatchUploadForm: React.FC<BatchUploadFormProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const parseCSV = (csvText: string): PatientData[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
    
    const fileHeadersOriginal = lines[0].split(',').map(h => h.trim());
    const fileHeadersLower = fileHeadersOriginal.map(h => h.toLowerCase());

    // These are the canonical keys expected by the application (all lowercase)
    const requiredCanonicalHeaders = [
      'id', 'age', 'gender', // 'ethnicity' removed
      'diagnosisCodes', 'previousAdmissions', 'lengthOfStayDays', 'treatmentSummary',
      'keyLabResultsText', 'hasSupportSystem', 'housingSituation'
    ];
    
    for (const reqCanonicalHeader of requiredCanonicalHeaders) {
      if (!fileHeadersLower.includes(reqCanonicalHeader)) {
        console.error("Original headers from file:", fileHeadersOriginal);
        console.error("Lowercase headers from file (used for check):", fileHeadersLower);
        console.error("Searching for required canonical header (lowercase):", reqCanonicalHeader);
        throw new Error(`Missing required CSV header: '${reqCanonicalHeader}'. Please ensure your CSV file includes this header (case-insensitive). Detected headers from file (lowercase): [${fileHeadersLower.join(', ')}]. Required headers are: [${requiredCanonicalHeaders.join(', ')}]`);
      }
    }

    // Create a map from the canonical header key to its index in the CSV file
    const headerIndexMap: { [key: string]: number } = {};
    requiredCanonicalHeaders.forEach(canonicalHeader => {
      const indexInFile = fileHeadersLower.indexOf(canonicalHeader);
      // This check should always pass due to the loop above, but defensive coding:
      if (indexInFile !== -1) {
        headerIndexMap[canonicalHeader] = indexInFile;
      }
    });

    const patients: PatientData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== fileHeadersOriginal.length) {
        console.warn(`Skipping row ${i+1}: Mismatched number of columns. Expected ${fileHeadersOriginal.length}, got ${values.length}. Row content: ${lines[i]}`);
        continue;
      }
      
      // Helper to get value by canonical header name
      const getValue = (headerName: string): string => {
        const index = headerIndexMap[headerName];
        return values[index]?.trim() || '';
      };

      const patientInput: PatientDataInput = {
        demographics: {
          age: getValue('age'), // Stays as string, form handles conversion
          gender: getValue('gender') as PatientDataInput['demographics']['gender'],
          // ethnicity: getValue('ethnicity'), // Removed
        },
        medicalHistory: {
          diagnosisCodes: getValue('diagnosisCodes'),
          previousAdmissions: getValue('previousAdmissions'), // Stays as string
          lengthOfStayDays: getValue('lengthOfStayDays'), // Stays as string
          treatmentSummary: getValue('treatmentSummary'),
        },
        labResults: {
          keyLabResultsText: getValue('keyLabResultsText'),
        },
        socialDeterminants: {
          hasSupportSystem: getValue('hasSupportSystem') as PatientDataInput['socialDeterminants']['hasSupportSystem'],
          housingSituation: getValue('housingSituation') as PatientDataInput['socialDeterminants']['housingSituation'],
        },
      };
      
      const patientId = getValue('id') || `patient_${Date.now()}_${i}`;
      patients.push({ id: patientId, data: patientInput });
    }
    return patients;
  };


  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        if (!csvText) {
          throw new Error("File content is empty or unreadable.");
        }
        const parsedPatients = parseCSV(csvText); 
        onUpload(parsedPatients);
      } catch (err) {
        console.error("CSV Parsing error:", err);
        setError(err instanceof Error ? err.message : "Failed to parse CSV file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [file, onUpload, parseCSV]); // Added parseCSV to dependencies

  return (
    <Card title="Batch Patient Data Upload (CSV)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csvFile" className="block text-sm font-medium text-slate-700 dark:text-text-secondary mb-1">
            Upload CSV File
          </label>
          <input
            type="file"
            id="csvFile"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-text-on-primary-bg hover:file:bg-yellow-300"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
            CSV must include headers (case-insensitive): id, age, gender, diagnosisCodes, previousAdmissions, lengthOfStayDays, treatmentSummary, keyLabResultsText, hasSupportSystem, housingSituation.
          </p>
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
        <Button type="submit" isLoading={isLoading} disabled={!file || isLoading}>
          {isLoading ? 'Processing...' : 'Upload and Process Batch'}
        </Button>
      </form>
       <p className="mt-4 text-sm text-slate-600 dark:text-text-secondary">
        <strong>Note:</strong> For demonstration, this uses a simplified CSV parser. In a production environment, consider using a robust library like PapaParse. 
        Each patient from the CSV will need to be predicted individually after upload.
      </p>
    </Card>
  );
};