
import React from 'react';
import { PredictionOutput } from '../types';
import { Card } from './common/Card';

interface PredictionResultDisplayProps {
  result: PredictionOutput;
}

export const PredictionResultDisplay: React.FC<PredictionResultDisplayProps> = ({ result }) => {
  const riskColor = result.riskPercentage > 70 
    ? 'text-red-600 dark:text-red-400' 
    : result.riskPercentage > 40 
    ? 'text-yellow-600 dark:text-yellow-400' 
    : 'text-green-600 dark:text-green-400';

  return (
    <Card title="Prediction Result" className="mt-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary dark:text-primary mb-2">Readmission Risk</h3>
          <p className={`text-5xl font-bold ${riskColor}`}>{result.riskPercentage}%</p>
          <p className="text-sm text-slate-600 dark:text-text-secondary mt-1">Predicted likelihood of readmission within 30 days.</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary dark:text-primary mb-2">Key Risk Drivers</h3>
          {result.keyRiskDrivers && result.keyRiskDrivers.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-slate-800 dark:text-text-primary pl-2">
              {result.keyRiskDrivers.map((driver, index) => (
                <li key={index}>{driver}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 dark:text-text-secondary">No specific risk drivers identified.</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary dark:text-primary mb-2">Proactive Recommendations</h3>
          {result.proactiveRecommendations && result.proactiveRecommendations.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-slate-800 dark:text-text-primary pl-2">
              {result.proactiveRecommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          ) : (
             <p className="text-slate-600 dark:text-text-secondary">No specific recommendations provided.</p>
          )}
        </div>
      </div>
    </Card>
  );
};