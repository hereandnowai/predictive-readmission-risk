
import React from 'react';
import { PatientData, PredictionOutput, PatientDataInput } from '../types';
import { Card } from './common/Card';
import { PredictionResultDisplay } from './PredictionResultDisplay';

interface PatientProfileModalProps {
  patient: PatientData;
  prediction: PredictionOutput | null;
  onClose: () => void;
}

const DataField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="mb-2">
    <span className="font-semibold text-secondary dark:text-primary">{label}: </span>
    <span className="text-slate-700 dark:text-text-secondary">{value || 'N/A'}</span>
  </div>
);

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ patient, prediction, onClose }) => {
  const pData: PatientDataInput = patient.data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white dark:bg-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-1 sm:p-2"> {/* Reduced padding slightly */}
        <Card title={`Patient Profile - ID: ${patient.id}`} className="border-0 shadow-none !p-3 sm:!p-4"> {/* Overriding Card padding */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-600 dark:text-text-secondary hover:text-secondary dark:hover:text-primary text-2xl font-bold"
            aria-label="Close profile"
          >
            &times;
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <section>
              <h4 className="text-lg font-semibold text-secondary dark:text-primary border-b border-slate-300 dark:border-primary/40 mb-2">Demographics</h4>
              <DataField label="Age" value={pData.demographics.age} />
              <DataField label="Gender" value={pData.demographics.gender} />
              {/* <DataField label="Ethnicity" value={pData.demographics.ethnicity} /> Removed */}
            </section>
            
            <section>
              <h4 className="text-lg font-semibold text-secondary dark:text-primary border-b border-slate-300 dark:border-primary/40 mb-2">Social Determinants</h4>
              <DataField label="Has Support System" value={pData.socialDeterminants.hasSupportSystem} />
              <DataField label="Housing Situation" value={pData.socialDeterminants.housingSituation} />
            </section>

            <section className="md:col-span-2">
              <h4 className="text-lg font-semibold text-secondary dark:text-primary border-b border-slate-300 dark:border-primary/40 mb-2">Medical History</h4>
              <DataField label="Diagnosis Codes" value={pData.medicalHistory.diagnosisCodes} />
              <DataField label="Previous Admissions" value={pData.medicalHistory.previousAdmissions} />
              <DataField label="Length of Last Stay (Days)" value={pData.medicalHistory.lengthOfStayDays} />
              <DataField label="Treatment Summary" value={<pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-text-secondary">{pData.medicalHistory.treatmentSummary || 'N/A'}</pre>} />
            </section>

            <section className="md:col-span-2">
              <h4 className="text-lg font-semibold text-secondary dark:text-primary border-b border-slate-300 dark:border-primary/40 mb-2">Key Lab Results</h4>
              <DataField label="Details" value={<pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-text-secondary">{pData.labResults.keyLabResultsText || 'N/A'}</pre>} />
            </section>
          </div>

          {prediction ? (
            <PredictionResultDisplay result={prediction} />
          ) : (
            <p className="text-center text-slate-600 dark:text-text-secondary italic mt-4">No prediction data available for this patient yet.</p>
          )}
          
          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="bg-primary hover:bg-yellow-300 text-text-on-primary-bg font-semibold py-2 px-6 rounded transition-colors duration-150"
            >
              Close
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};